import { HttpAgent, Message as AguiMessage } from "@ag-ui/client";
import { Message, RunAgentInput } from "@ag-ui/core";
import { Agent, GenerateCopilotResponseMutationVariables } from "@copilotkit/runtime-client-gql";
import { CopilotKitError, CopilotKitErrorCode } from "@copilotkit/shared";

export interface AgUiClientOptions {
  url: string;
  publicApiKey?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  handleErrors?: (error: Error) => void;
  handleWarning?: (warning: string) => void;
}

export interface AgUiConversationResponse {
  data?: {
    conversation: {
      messages: AguiMessage[];
      threadId: string;
    };
  };
  error?: Error;
}

export interface AgUiAgentsResponse {
  data?: {
    availableAgents: {
      agents: Agent[];
    };
  };
  error?: Error;
}

export interface AgUiStateResponse {
  data?: {
    agentState: any;
  };
  error?: Error;
}

/**
 * Client for directly communicating with ag_ui servers
 * This provides compatibility with the existing CopilotRuntimeClient interface
 */
export class AgUiClient {
  private agent: HttpAgent;
  private handleErrors?: (error: Error) => void;
  private handleWarning?: (warning: string) => void;

  constructor(options: AgUiClientOptions) {
    this.handleErrors = options.handleErrors;
    this.handleWarning = options.handleWarning;

    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (options.publicApiKey) {
      headers["Authorization"] = `Bearer ${options.publicApiKey}`;
    }

    try {
      this.agent = new HttpAgent({
        url: options.url,
        headers,
        threadId: "default-thread",
        description: "CopilotKit AgUI Client",
      });
    } catch (error) {
      const wrappedError = new CopilotKitError({
        message: `Failed to initialize ag_ui client: ${error instanceof Error ? error.message : String(error)}`,
        code: CopilotKitErrorCode.UNKNOWN,
      });
      if (this.handleErrors) {
        this.handleErrors(wrappedError);
      }
      throw wrappedError;
    }
  }

  /**
   * Generate copilot response using ag_ui client
   * Converts GraphQL-style variables to ag_ui format
   */
  generateCopilotResponse({
    data,
    properties,
    signal,
  }: {
    data: GenerateCopilotResponseMutationVariables["data"];
    properties?: GenerateCopilotResponseMutationVariables["properties"];
    signal?: AbortSignal;
  }) {
    try {
      // Convert data to ag_ui format
      const threadId = data.threadId || "default";
      const messages = this.convertMessagesToAgUi(data.messages || []);
      
      // Create a stream-like response that matches the expected interface
      return {
        subscribe: (callback: (result: { data?: any; hasNext?: boolean; error?: Error }) => void) => {
          this.streamCopilotResponse({
            threadId,
            messages,
            signal,
            onChunk: (chunk) => {
              callback({ data: chunk, hasNext: true });
            },
            onComplete: () => {
              callback({ hasNext: false });
            },
            onError: (error) => {
              callback({ error });
            },
          });
        },
      };
    } catch (error) {
      const wrappedError = new CopilotKitError({
        message: `Failed to generate response: ${error instanceof Error ? error.message : String(error)}`,
        code: CopilotKitErrorCode.UNKNOWN,
      });
      if (this.handleErrors) {
        this.handleErrors(wrappedError);
      }
      throw wrappedError;
    }
  }

  /**
   * Get available agents from ag_ui server
   */
  async availableAgents(): Promise<AgUiAgentsResponse> {
    try {
      // ag_ui doesn't have a direct agents endpoint, return empty for now
      // This can be extended based on ag_ui server capabilities
      return {
        data: {
          availableAgents: {
            agents: [],
          },
        },
      };
    } catch (error) {
      const wrappedError = new CopilotKitError({
        message: `Failed to fetch agents: ${error instanceof Error ? error.message : String(error)}`,
        code: CopilotKitErrorCode.UNKNOWN,
      });
      if (this.handleErrors) {
        this.handleErrors(wrappedError);
      }
      return { error: wrappedError };
    }
  }

  /**
   * Load agent state from ag_ui server
   */
  async loadAgentState(data: { threadId: string; agentName: string }): Promise<AgUiStateResponse> {
    try {
      // ag_ui might not have direct agent state loading, implement as needed
      return {
        data: {
          agentState: null,
        },
      };
    } catch (error) {
      const wrappedError = new CopilotKitError({
        message: `Failed to load agent state: ${error instanceof Error ? error.message : String(error)}`,
        code: CopilotKitErrorCode.UNKNOWN,
      });
      if (this.handleErrors) {
        this.handleErrors(wrappedError);
      }
      return { error: wrappedError };
    }
  }

  /**
   * Create a ReadableStream for copilot responses
   */
  asStream<S, T>(source: any): ReadableStream<S> {
    const handleErrors = this.handleErrors;
    return new ReadableStream<S>({
      start(controller) {
        source.subscribe(({ data, hasNext, error }: { data?: S; hasNext?: boolean; error?: Error }) => {
          if (error) {
            if (handleErrors) {
              handleErrors(error);
            }
            controller.error(error);
          } else if (data) {
            controller.enqueue(data);
            if (!hasNext) {
              controller.close();
            }
          }
        });
      },
    });
  }

  /**
   * Stream response from ag_ui client
   */
  private async streamCopilotResponse({
    threadId,
    messages,
    signal,
    onChunk,
    onComplete,
    onError,
  }: {
    threadId: string;
    messages: Message[];
    signal?: AbortSignal;
    onChunk: (chunk: any) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
  }) {
    try {
      // Update agent threadId
      this.agent.threadId = threadId;
      
      // Use ag_ui HttpAgent to run agent
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        throw new Error("No messages provided");
      }

      // Create a basic run input
      const runInput: RunAgentInput = {
        runId: `run-${Date.now()}`,
        messages: messages,
      };

      // Run the agent and handle streaming response
      const responseObservable = this.agent.runAgent(runInput);
      
      responseObservable.subscribe({
        next: (event) => {
          // Convert ag_ui events to CopilotKit format
          if (event.type === "TextMessageContent") {
            onChunk({
              generateCopilotResponse: {
                message: {
                  content: event.content,
                  role: "assistant",
                },
              },
            });
          }
        },
        complete: () => {
          onComplete();
        },
        error: (error) => {
          onError(error instanceof Error ? error : new Error(String(error)));
        },
      });
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Convert CopilotKit messages to ag_ui format
   */
  private convertMessagesToAgUi(messages: any[]): Message[] {
    return messages.map((msg) => ({
      id: msg.id || `msg-${Date.now()}`,
      content: msg.content || msg.text || "",
      role: msg.role || "user",
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Static method to remove GraphQL typename (for compatibility)
   */
  static removeGraphQLTypename(data: any) {
    if (Array.isArray(data)) {
      data.forEach((item) => AgUiClient.removeGraphQLTypename(item));
    } else if (typeof data === "object" && data !== null) {
      delete data.__typename;
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === "object" && data[key] !== null) {
          AgUiClient.removeGraphQLTypename(data[key]);
        }
      });
    }
    return data;
  }
}