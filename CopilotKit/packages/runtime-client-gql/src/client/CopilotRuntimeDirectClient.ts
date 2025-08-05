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
            // Handle abort signal
            if (signal?.aborted) {
              controller.close();
              return;
            }

            // Set up the AG_UI agent with messages
            this.httpAgent.messages = aguiMessages;

            // Prepare tools/actions for the agent
            const tools = (data.actions || []).map(action => ({
              name: action.name,
              description: action.description,
              parameters: JSON.parse(action.jsonSchema || '{}'),
            }));

            // Prepare forwarded properties
            const forwardedProps = {
              ...properties,
              threadMetadata: data.metadata,
              agentSession: data.agentSession,
              agentStates: data.agentStates,
            };

            // Generate response from AG_UI agent
            const responseObservable = this.httpAgent.legacy_to_be_removed_runAgentBridged({
              tools,
              forwardedProps,
            });

            // Set up abort handling
            const abortHandler = () => {
              controller.close();
            };
            signal?.addEventListener('abort', abortHandler);

            // Convert AG_UI events back to GQL format and stream them
            responseObservable.subscribe({
              next: (event) => {
                try {
                  // Skip if already aborted
                  if (signal?.aborted) return;

                  const gqlEvent = this.convertAGUIEventToGQL(event);
                  if (gqlEvent) {
                    controller.enqueue(gqlEvent);
                  }
                } catch (error) {
                  this.handleErrors?.(error as Error);
                  if (!signal?.aborted) {
                    controller.error(error);
                  }
                }
              },
              error: (error) => {
                // Clean up abort listener
                signal?.removeEventListener('abort', abortHandler);
                
                if (signal?.aborted) {
                  // If aborted, just close silently
                  controller.close();
                  return;
                }

                this.handleErrors?.(error);
                controller.error(error);
              },
              complete: () => {
                // Clean up abort listener
                signal?.removeEventListener('abort', abortHandler);
                controller.close();
              }
            });

          } catch (error) {
            this.handleErrors?.(error as Error);
            if (!signal?.aborted) {
              controller.error(error);
            }
          }
        }
      });

      // Return an observable-like interface compatible with the GraphQL client
      return {
        subscribe: (observer: any) => {
          if (signal?.aborted) {
            observer.complete?.();
            return () => {};
          }

          const reader = responseStream.getReader();
          
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  observer.complete?.();
                  break;
                }
                
                // Check for abort before processing
                if (signal?.aborted) {
                  observer.complete?.();
                  break;
                }

                observer.next?.({ data: value, hasNext: !done });
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
          setTimeout(() => {
            if (!signal?.aborted) {
              observer.error?.(error);
            } else {
              observer.complete?.();
            }
          }, 0);
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
    // Handle AG_UI runtime events and convert them to GraphQL format
    
    switch (event.type) {
      case "text_message_start":
        return {
          __typename: "TextMessageOutput",
          id: event.messageId || randomId(),
          createdAt: new Date().toISOString(),
          role: "assistant",
          content: "",
          status: { code: "PENDING" }
        };

      case "text_message_content":
        return {
          __typename: "TextMessageOutput", 
          id: event.messageId,
          content: event.content,
          role: "assistant",
        };

      case "text_message_end":
        return {
          __typename: "TextMessageOutput",
          id: event.messageId,
          status: { code: "SUCCESS" }
        };

      case "action_execution_start":
        return {
          __typename: "ActionExecutionMessageOutput",
          id: event.actionExecutionId,
          name: event.actionName,
          arguments: [],
          parentMessageId: event.parentMessageId,
          status: { code: "PENDING" }
        };

      case "action_execution_args":
        return {
          __typename: "ActionExecutionMessageOutput",
          id: event.actionExecutionId,
          arguments: [event.args],
        };

      case "action_execution_end":
        return {
          __typename: "ActionExecutionMessageOutput",
          id: event.actionExecutionId,
          status: { code: "SUCCESS" }
        };

      case "agent_state_message":
        return {
          __typename: "AgentStateMessageOutput",
          id: randomId(),
          threadId: event.threadId,
          agentName: event.agentName,
          state: event.state,
          running: event.running || false,
          role: "assistant",
          nodeName: event.nodeName,
          runId: event.runId,
          active: event.active || false,
          createdAt: new Date().toISOString(),
          status: { code: "SUCCESS" }
        };

      case "meta_event":
        if (event.name === "langgraph_interrupt") {
          return {
            __typename: "LangGraphInterruptEvent",
            type: "MetaEvent",
            name: "LANG_GRAPH_INTERRUPT_EVENT",
            value: event.value
          };
        }
        break;

      case "error":
        // Handle AG_UI errors appropriately
        throw new CopilotKitLowLevelError({
          error: new Error(event.message || "AG_UI Error"),
          url: this.httpAgent.url || "ag_ui_agent",
          message: event.message || "Unknown AG_UI error occurred"
        });

      default:
        // For unhandled event types, try to preserve the original structure
        // while ensuring compatibility with GraphQL expectations
        return {
          __typename: "TextMessageOutput",
          id: event.id || randomId(),
          createdAt: new Date().toISOString(),
          content: event.content || "",
          role: "assistant",
          status: { code: "SUCCESS" },
          ...event // Spread original event data
        };
    }

    return null;
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