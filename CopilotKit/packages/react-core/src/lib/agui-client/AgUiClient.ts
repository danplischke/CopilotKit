import { GenerateCopilotResponseMutationVariables } from "@copilotkit/runtime-client-gql";
import { CopilotKitError, CopilotKitErrorCode } from "@copilotkit/shared";
import { ICopilotClient } from "../ICopilotClient";

export interface AgUiClientOptions {
  url: string;
  publicApiKey?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  handleErrors?: (error: Error) => void;
  handleWarning?: (warning: string) => void;
}

/**
 * Simple ag_ui client adapter that implements ICopilotClient interface
 * This is a minimal implementation to demonstrate the pattern
 */
export class AgUiClient implements ICopilotClient {
  private url: string;
  private headers: Record<string, string>;
  private handleErrors?: (error: Error) => void;
  private handleWarning?: (warning: string) => void;

  constructor(options: AgUiClientOptions) {
    this.url = options.url;
    this.handleErrors = options.handleErrors;
    this.handleWarning = options.handleWarning;

    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.publicApiKey) {
      this.headers["Authorization"] = `Bearer ${options.publicApiKey}`;
    }
  }

  /**
   * Generate copilot response - simplified implementation
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
    // Return a simple observable-like object that matches the expected interface
    return {
      subscribe: (callback: any) => {
        // Simulate a basic response for now
        // In a real implementation, this would connect to the ag_ui server
        setTimeout(() => {
          callback({
            data: {
              generateCopilotResponse: {
                message: {
                  content: "Hello from ag_ui server! This is a placeholder response.",
                  role: "assistant",
                },
              },
            },
            hasNext: true,
          });
          
          // End the stream
          setTimeout(() => {
            callback({ hasNext: false });
          }, 100);
        }, 500);
        
        return { unsubscribe: () => {} };
      },
    };
  }

  /**
   * Get available agents - simplified implementation that matches expected interface
   */
  availableAgents() {
    // Return a simple object that can be used like a urql result
    return {
      data: {
        availableAgents: {
          agents: [],
        },
      },
      error: undefined,
      extensions: {},
      stale: false,
    };
  }

  /**
   * Load agent state - simplified implementation that matches expected interface
   */
  loadAgentState(data: { threadId: string; agentName: string }) {
    // Return a simple object that can be used like a urql result
    return {
      data: {
        loadAgentState: {
          state: null,
        },
      },
      error: undefined,
      extensions: {},
      stale: false,
    };
  }

  /**
   * Simple implementation of asStream for compatibility
   */
  asStream<S, T>(source: any): ReadableStream<S> {
    return new ReadableStream<S>({
      start(controller) {
        if (source.subscribe) {
          const subscription = source.subscribe({
            next: (result: any) => {
              if (result.error) {
                controller.error(result.error);
              } else if (result.data) {
                controller.enqueue(result.data);
                if (!result.hasNext) {
                  controller.close();
                }
              }
            },
            error: (error: Error) => {
              controller.error(error);
            },
            complete: () => {
              controller.close();
            },
          });
        }
      },
    });
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