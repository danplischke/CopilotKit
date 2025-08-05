import { HttpAgent } from "@ag-ui/client";
import { Message as AGUIMessage, ToolCall } from "@ag-ui/client";
import { 
  ResolvedCopilotKitError,
  CopilotKitLowLevelError,
  CopilotKitError,
  randomId
} from "@copilotkit/shared";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import * as gql from "../client";
import { Message, TextMessage, ActionExecutionMessage, ResultMessage } from "./types";
import { gqlToAGUI, aguiToGQL } from "../message-conversion";

/**
 * Interface compatible with CopilotRuntimeClient but connects directly to AG_UI servers
 * bypassing the GraphQL layer for improved performance and reduced complexity.
 */
export interface CopilotRuntimeDirectClientOptions {
  url: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  handleErrors?: (error: Error) => void;
  handleWarning?: (warning: string) => void;
}

/**
 * Direct AG_UI client that implements the same interface as CopilotRuntimeClient
 * but communicates directly with AG_UI servers without GraphQL middleware.
 */
export class CopilotRuntimeDirectClient {
  private httpAgent: HttpAgent;
  public handleErrors?: (error: Error) => void;
  public handleWarning?: (warning: string) => void;
  private headers: Record<string, string>;

  constructor(options: CopilotRuntimeDirectClientOptions) {
    this.handleErrors = options.handleErrors;
    this.handleWarning = options.handleWarning;
    this.headers = options.headers || {};

    this.httpAgent = new HttpAgent({
      url: options.url,
      headers: this.headers,
    });
  }

  /**
   * Generate copilot response directly from AG_UI agent
   * This method is compatible with the GraphQL client's interface
   */
  generateCopilotResponse({
    data,
    properties,
    signal,
  }: {
    data: {
      messages: Message[];
      actions?: any[];
      agentSession?: any;
      agentStates?: any[];
      metadata?: Record<string, any>;
    };
    properties?: Record<string, any>;
    signal?: AbortSignal;
  }) {
    try {
      // Convert GQL messages to AG_UI format
      const aguiMessages = gqlToAGUI(data.messages);
      
      // Create a readable stream that will emit the response
      const responseStream = new ReadableStream({
        start: async (controller) => {
          try {
            // Set up the AG_UI agent with messages
            this.httpAgent.messages = aguiMessages;

            // Prepare tools/actions for the agent
            const tools = (data.actions || []).map(action => ({
              name: action.name,
              description: action.description,
              parameters: JSON.parse(action.jsonSchema || '{}'),
            }));

            // Generate response from AG_UI agent
            const responseObservable = this.httpAgent.legacy_to_be_removed_runAgentBridged({
              tools,
              forwardedProps: {
                ...properties,
                threadMetadata: data.metadata,
              },
            });

            // Convert AG_UI events back to GQL format and stream them
            responseObservable.subscribe({
              next: (event) => {
                const gqlEvent = this.convertAGUIEventToGQL(event);
                if (gqlEvent) {
                  controller.enqueue(gqlEvent);
                }
              },
              error: (error) => {
                this.handleErrors?.(error);
                controller.error(error);
              },
              complete: () => {
                controller.close();
              }
            });

          } catch (error) {
            this.handleErrors?.(error as Error);
            controller.error(error);
          }
        }
      });

      // Return an observable-like interface compatible with the GraphQL client
      return {
        subscribe: (observer: any) => {
          const reader = responseStream.getReader();
          
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  observer.complete?.();
                  break;
                }
                observer.next?.({ data: value, hasNext: true });
              }
            } catch (error) {
              if (signal?.aborted) {
                // Handle abort gracefully
                observer.complete?.();
                return;
              }
              observer.error?.(error);
            }
          };

          pump();

          // Return unsubscribe function
          return () => {
            reader.cancel();
          };
        }
      };

    } catch (error) {
      // Return a failed observable
      return {
        subscribe: (observer: any) => {
          setTimeout(() => observer.error?.(error), 0);
          return () => {};
        }
      };
    }
  }

  /**
   * Get available agents - for AG_UI this is typically the configured agent
   */
  availableAgents() {
    return {
      toPromise: async () => ({
        data: {
          availableAgents: [
            {
              name: "default",
              description: "AG_UI Agent",
              agentId: "ag-ui-agent",
            }
          ]
        },
        error: null
      })
    };
  }

  /**
   * Load agent state (placeholder implementation)
   */
  loadAgentState(data: { threadId: string; agentName: string }) {
    return {
      toPromise: async () => ({
        data: {
          loadAgentState: {
            state: "{}",
            config: "{}",
          }
        },
        error: null
      })
    };
  }

  /**
   * Create a stream from the AG_UI observable
   */
  public asStream<S, T>(source: any): ReadableStream<S> {
    return new ReadableStream<S>({
      start(controller) {
        source.subscribe({
          next: (data: S) => {
            controller.enqueue(data);
          },
          error: (error: Error) => {
            controller.error(error);
          },
          complete: () => {
            controller.close();
          }
        });
      },
    });
  }

  /**
   * Convert AG_UI events to GraphQL-compatible format
   */
  private convertAGUIEventToGQL(event: any): any {
    // This is a simplified conversion - would need to be expanded based on specific AG_UI event types
    
    if (event.type === "text_message_start") {
      return {
        __typename: "TextMessageOutput",
        id: event.messageId || randomId(),
        createdAt: new Date().toISOString(),
        role: "assistant",
        content: "",
        status: { code: "PENDING" }
      };
    }

    if (event.type === "text_message_content") {
      return {
        __typename: "TextMessageOutput", 
        id: event.messageId,
        content: event.content,
        role: "assistant",
      };
    }

    if (event.type === "text_message_end") {
      return {
        __typename: "TextMessageOutput",
        id: event.messageId,
        status: { code: "SUCCESS" }
      };
    }

    if (event.type === "action_execution_start") {
      return {
        __typename: "ActionExecutionMessageOutput",
        id: event.actionExecutionId,
        name: event.actionName,
        arguments: [],
        parentMessageId: event.parentMessageId,
        status: { code: "PENDING" }
      };
    }

    if (event.type === "action_execution_args") {
      return {
        __typename: "ActionExecutionMessageOutput",
        id: event.actionExecutionId,
        arguments: [event.args],
      };
    }

    if (event.type === "action_execution_end") {
      return {
        __typename: "ActionExecutionMessageOutput",
        id: event.actionExecutionId,
        status: { code: "SUCCESS" }
      };
    }

    // Default: return the event as-is for unhandled types
    return event;
  }

  /**
   * Remove GraphQL typename from data (compatibility method)
   */
  static removeGraphQLTypename(data: any) {
    if (Array.isArray(data)) {
      data.forEach((item) => CopilotRuntimeDirectClient.removeGraphQLTypename(item));
    } else if (typeof data === "object" && data !== null) {
      delete data.__typename;
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === "object" && data[key] !== null) {
          CopilotRuntimeDirectClient.removeGraphQLTypename(data[key]);
        }
      });
    }
    return data;
  }
}