import * as packageJson from "../../package.json";
import {
  GenerateCopilotResponseMutationVariables,
  GenerateCopilotResponseInput,
  AvailableAgentsQuery,
  LoadAgentStateQuery,
  MessageStatusCode,
  ResponseStatusCode,
} from "../graphql/@generated/graphql";
import {
  ResolvedCopilotKitError,
  CopilotKitLowLevelError,
  CopilotKitError,
  CopilotKitVersionMismatchError,
  getPossibleVersionMismatch,
} from "@copilotkit/shared";
import { ICopilotRuntimeClient } from "./interfaces";

export interface DirectAgUiConfig {
  endpoint: string;
  protocol: 'http' | 'websocket' | 'grpc';
  authentication?: {
    type: 'bearer' | 'apikey' | 'custom';
    credentials: string | object;
  };
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface DirectAgUiRuntimeClientOptions {
  url: string;
  publicApiKey?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  handleGQLErrors?: (error: Error) => void;
  handleGQLWarning?: (warning: string) => void;
  directConfig?: DirectAgUiConfig;
}

/**
 * Direct AgUI Runtime Client that communicates directly with an ag_ui server
 * without going through the GraphQL proxy layer.
 */
export class DirectAgUiRuntimeClient implements ICopilotRuntimeClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private credentials?: RequestCredentials;
  public handleGQLErrors?: (error: Error) => void;
  public handleGQLWarning?: (warning: string) => void;
  private directConfig?: DirectAgUiConfig;
  
  // Add client property for compatibility with CopilotRuntimeClient interface
  public client: any;

  constructor(options: DirectAgUiRuntimeClientOptions) {
    this.baseUrl = options.url;
    this.handleGQLErrors = options.handleGQLErrors;
    this.handleGQLWarning = options.handleGQLWarning;
    this.credentials = options.credentials;
    this.directConfig = options.directConfig;

    // Setup headers
    this.headers = {
      'Content-Type': 'application/json',
      'X-CopilotKit-Runtime-Client-Version': packageJson.version,
      ...options.headers,
    };

    if (options.publicApiKey) {
      this.headers["x-copilotcloud-public-api-key"] = options.publicApiKey;
    }

    // Create a mock client property for compatibility
    this.client = {
      url: this.baseUrl,
      // Add other properties as needed for compatibility
    };
  }

  /**
   * Create a native fetch function that handles ag_ui server communication
   */
  private createFetchFn = (signal?: AbortSignal) => {
    return async (url: string, init?: RequestInit): Promise<Response> => {
      const publicApiKey = this.headers["x-copilotcloud-public-api-key"];
      
      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            ...this.headers,
            ...init?.headers,
          },
          credentials: this.credentials,
          signal,
        });

        // Check for version mismatch (similar to GraphQL client)
        const mismatch = publicApiKey
          ? null
          : await getPossibleVersionMismatch({
              runtimeVersion: response.headers.get("X-CopilotKit-Runtime-Version")!,
              runtimeClientGqlVersion: packageJson.version,
            });

        if (response.status !== 200) {
          if (response.status >= 400 && response.status <= 500) {
            if (mismatch) {
              throw new CopilotKitVersionMismatchError(mismatch);
            }
            throw new ResolvedCopilotKitError({ status: response.status });
          }
        }

        if (mismatch && this.handleGQLWarning) {
          this.handleGQLWarning(mismatch.message);
        }

        return response;
      } catch (error) {
        // Let abort error pass through. It will be suppressed later
        if (
          (error as Error).message.includes("BodyStreamBuffer was aborted") ||
          (error as Error).message.includes("signal is aborted without reason")
        ) {
          throw error;
        }
        if (error instanceof CopilotKitError) {
          throw error;
        }
        throw new CopilotKitLowLevelError({ error: error as Error, url });
      }
    };
  };

  /**
   * Convert GraphQL input to ag_ui native format
   */
  private convertToAgUiFormat(data: GenerateCopilotResponseInput): any {
    // Convert GraphQL structure to ag_ui native format
    // This bypasses the GraphQL conversion layers
    return {
      messages: data.messages,
      threadId: data.threadId,
      runId: data.runId,
      metadata: data.metadata,
      frontend: data.frontend,
      extensions: data.extensions,
      agentSession: data.agentSession,
      agentState: data.agentState,
      agentStates: data.agentStates,
      cloud: data.cloud,
      forwardedParameters: data.forwardedParameters,
      metaEvents: data.metaEvents,
    };
  }

  /**
   * Convert ag_ui response to GraphQL-compatible format
   */
  private convertFromAgUiFormat(response: any): any {
    // Convert ag_ui response to match GraphQL expectations
    return {
      generateCopilotResponse: {
        threadId: response.threadId,
        runId: response.runId,
        extensions: response.extensions,
        messages: response.messages || [],
        metaEvents: response.metaEvents || [],
        status: response.status || {
          code: ResponseStatusCode.Success,
        },
      },
    };
  }

  /**
   * Generate copilot response using direct ag_ui communication
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
    const fetchFn = this.createFetchFn(signal);
    
    // Convert to ag_ui format
    const agUiData = this.convertToAgUiFormat(data);
    const requestBody = {
      data: agUiData,
      ...(properties && { properties }),
    };

    // Create a promise-based result that mimics URQL's OperationResultSource
    const responsePromise = fetchFn(`${this.baseUrl}/generate`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return this.convertFromAgUiFormat(result);
    });

    // Create a result that mimics URQL's subscription interface
    const result = {
      subscribe: (observer: { (result: { data?: any; error?: Error; hasNext?: boolean }): void }) => {
        responsePromise
          .then((data) => {
            observer({ data, hasNext: false });
          })
          .catch((error) => {
            if (this.handleGQLErrors) {
              this.handleGQLErrors(error);
            }
            observer({ error, hasNext: false });
          });
      },
    };

    return result;
  }

  /**
   * Convert a subscription-like source to a ReadableStream
   */
  public asStream<S, T>(source: { subscribe: (observer: { (result: { data?: S; error?: Error; hasNext?: boolean }): void }) => void }) {
    const handleGQLErrors = this.handleGQLErrors;
    
    return new ReadableStream<S>({
      start(controller) {
        source.subscribe(({ data, error, hasNext }) => {
          if (error) {
            if (
              error.message.includes("BodyStreamBuffer was aborted") ||
              error.message.includes("signal is aborted without reason")
            ) {
              // close the stream if there is no next item
              if (!hasNext) controller.close();
              
              //suppress this specific error
              console.warn("Abort error suppressed");
              return;
            }

            // Handle structured errors specially - check if it's a CopilotKitError with visibility
            if ((error as any).extensions?.visibility) {
              // Create a synthetic GraphQL error with the structured error info
              const syntheticError = {
                ...error,
                graphQLErrors: [
                  {
                    message: error.message,
                    extensions: (error as any).extensions,
                  },
                ],
              };

              if (handleGQLErrors) {
                handleGQLErrors(syntheticError);
              }
              return; // Don't close the stream for structured errors, let the error handler decide
            }

            controller.error(error);
            if (handleGQLErrors) {
              handleGQLErrors(error);
            }
          } else {
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
   * Get available agents using direct ag_ui communication
   */
  availableAgents() {
    const fetchFn = this.createFetchFn();
    
    const responsePromise = fetchFn(`${this.baseUrl}/agents`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return { data: result, error: null };
    }).catch((error) => {
      if (this.handleGQLErrors) {
        this.handleGQLErrors(error);
      }
      return { data: null, error };
    });

    // Return a promise-like interface that mimics URQL
    return {
      toPromise: () => responsePromise,
      // Add compatibility properties
      data: undefined,
      error: null,
    };
  }

  /**
   * Load agent state using direct ag_ui communication
   */
  loadAgentState(data: { threadId: string; agentName: string }) {
    const fetchFn = this.createFetchFn();
    
    const responsePromise = fetchFn(`${this.baseUrl}/agent-state`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return { data: result, error: null };
    }).catch((error) => {
      if (this.handleGQLErrors) {
        this.handleGQLErrors(error);
      }
      return { data: null, error };
    });

    return {
      toPromise: () => responsePromise,
      // Add compatibility properties
      data: undefined,
      error: null,
    };
  }

  /**
   * Utility method for removing GraphQL __typename fields (for compatibility)
   */
  static removeGraphQLTypename(data: any) {
    if (Array.isArray(data)) {
      data.forEach((item) => DirectAgUiRuntimeClient.removeGraphQLTypename(item));
    } else if (typeof data === "object" && data !== null) {
      delete data.__typename;
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === "object" && data[key] !== null) {
          DirectAgUiRuntimeClient.removeGraphQLTypename(data[key]);
        }
      });
    }
    return data;
  }
}