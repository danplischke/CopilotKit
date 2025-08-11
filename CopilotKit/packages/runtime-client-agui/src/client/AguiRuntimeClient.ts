import { Observable, Subject } from 'rxjs';
import {
  AguiRuntimeClientOptions,
  AguiAgentConfig,
  GenerateCopilotResponseData,
  AvailableAgent,
  LoadAgentStateData,
  LoadAgentStateResponse,
} from '../types';
import {
  ResolvedCopilotKitError,
  CopilotKitLowLevelError,
  CopilotKitError,
} from '@copilotkit/shared';
import { convertMessagesToAgui } from '../utils/message-conversion';

export class AguiRuntimeClient {
  private agents: Map<string, AguiAgentConfig>;
  public handleErrors?: (error: Error) => void;
  public handleWarning?: (warning: string) => void;

  constructor(options: AguiRuntimeClientOptions) {
    this.agents = new Map();
    this.handleErrors = options.handleErrors;
    this.handleWarning = options.handleWarning;

    // Initialize agents map
    for (const agent of options.agents) {
      this.agents.set(agent.name, agent);
    }
  }

  public asStream<T>(source: Observable<T>): ReadableStream<T> {
    return new ReadableStream<T>({
      start(controller) {
        const subscription = source.subscribe({
          next(value) {
            controller.enqueue(value);
          },
          error(err) {
            controller.error(err);
          },
          complete() {
            controller.close();
          },
        });
        return () => subscription.unsubscribe();
      },
    });
  }

  /**
   * Generate a copilot response by directly calling the ag_ui server
   */
  generateCopilotResponse({
    data,
    signal,
  }: {
    data: GenerateCopilotResponseData;
    signal?: AbortSignal;
  }): Observable<any> {
    const { messages, actions, threadId, runId, properties, forwardedParameters } = data;

    // Allow agentName to come from either data.agentName, data.agentSession.agentName, or
    // default to the only configured agent when exactly one is present.
    console.log(data)
    const inferredAgentName =
      (data as any).agentName ||
      (data as any).agentSession?.agentName ||
      (this.agents.size === 1 ? Array.from(this.agents.keys())[0] : undefined);

    if (!inferredAgentName) {
      throw new Error('agentName is required for ag_ui direct connection');
    }

    const agent = this.agents.get(inferredAgentName);
    if (!agent) {
      throw new Error(
        `Agent '${inferredAgentName}' not found. Available agents: ${Array.from(this.agents.keys()).join(', ')}`,
      );
    }

    const subject = new Subject<any>();

    this.executeAgentRequest(agent, {
      messages,
      actions,
      threadId,
      runId,
      properties,
      forwardedParameters,
      signal,
    })
      .then((response) => {
        // Process the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          subject.error(new Error('No response body available'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                subject.complete();
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.trim() === '') continue;
                
                try {
                  const event = JSON.parse(line);
                  subject.next(event);
                } catch (e) {
                  // Skip malformed JSON lines
                  console.warn('Failed to parse JSON line:', line);
                }
              }
            }
          } catch (error) {
            subject.error(error);
          }
        };

        processStream();
      })
      .catch((error) => {
        subject.error(this.handleError(error, agent.url));
      });

    return subject.asObservable();
  }

  /**
   * Get available agents from all configured ag_ui servers
   */
  async availableAgents(): Promise<AvailableAgent[]> {
    const agents: AvailableAgent[] = [];

    for (const [name, config] of this.agents) {
      try {
        const response = await fetch(`${config.url}/agents`, {
          method: 'GET',
          headers: this.buildHeaders(config),
          credentials: config.credentials,
        });

        if (!response.ok) {
          console.warn(`Failed to fetch agents from ${config.url}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          agents.push(...data.map((agent: any) => ({
            name: agent.name || name,
            id: agent.id || name,
            description: agent.description || config.description || '',
          })));
        } else if (data.agents && Array.isArray(data.agents)) {
          agents.push(...data.agents.map((agent: any) => ({
            name: agent.name || name,
            id: agent.id || name,
            description: agent.description || config.description || '',
          })));
        }
      } catch (error) {
        console.warn(`Failed to fetch agents from ${config.url}:`, error);
      }
    }

    return agents;
  }

  /**
   * Load agent state from the ag_ui server
   */
  async loadAgentState(data: LoadAgentStateData): Promise<LoadAgentStateResponse> {
    const { agentName, threadId } = data;
    const agent = this.agents.get(agentName);

    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }

    try {
      const response = await fetch(`${agent.url}/agents/${agentName}/state`, {
        method: 'POST',
        headers: this.buildHeaders(agent),
        credentials: agent.credentials,
        body: JSON.stringify({
          threadId,
          properties: {},
        }),
      });

      if (!response.ok) {
        throw new ResolvedCopilotKitError({
          status: response.status,
          url: agent.url,
          message: `Failed to load agent state: ${response.statusText}`,
        });
      }

      const result = await response.json();
      return {
        state: JSON.stringify(result.state || {}),
        messages: JSON.stringify(result.messages || []),
      };
    } catch (error) {
      throw this.handleError(error, agent.url);
    }
  }

  /**
   * Execute a request to an ag_ui agent
   */
  private async executeAgentRequest(
    agent: AguiAgentConfig,
    data: {
      messages: any[];
      actions?: any[];
      threadId?: string;
      runId?: string;
      properties?: Record<string, any>;
      forwardedParameters?: any;
      signal?: AbortSignal;
    }
  ): Promise<Response> {
    const { messages, actions, threadId, runId, properties, forwardedParameters, signal } = data;

    // Build AG-UI RunAgentInput expected by pydantic-ai's to_ag_ui app
    const ctx = (properties as any)?.context;
    const requestBody: any = {
      runId: runId || `run-${Date.now()}`,
      threadId: threadId || `ck-${Date.now()}`,
      messages: convertMessagesToAgui(messages),
      state: (properties as any)?.state ?? {},
      tools: [],
      context: Array.isArray(ctx) ? ctx : [],
      forwardedProps: forwardedParameters || properties || {},
    };

    const response = await fetch(`${agent.url}/agents/${agent.name}/run`, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(agent),
        'Content-Type': 'application/json',
      },
      credentials: agent.credentials,
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      throw new ResolvedCopilotKitError({
        status: response.status,
        url: agent.url,
        message: `Agent execution failed: ${response.statusText}`,
      });
    }

    return response;
  }

  /**
   * Build headers for requests
   */
  private buildHeaders(agent: AguiAgentConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...agent.headers,
    };

    return headers;
  }



  /**
   * Handle and transform errors
   */
  private handleError(error: any, url: string): CopilotKitError {
    if (error instanceof CopilotKitError) {
      return error;
    }

    return new CopilotKitLowLevelError({
      error: error instanceof Error ? error : new Error(String(error)),
      url,
    });
  }

  /**
   * Add a new agent configuration
   */
  addAgent(config: AguiAgentConfig): void {
    this.agents.set(config.name, config);
  }

  /**
   * Remove an agent configuration
   */
  removeAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * Get all configured agent names
   */
  getAgentNames(): string[] {
    return Array.from(this.agents.keys());
  }
}
