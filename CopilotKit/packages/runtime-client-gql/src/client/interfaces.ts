import {
  GenerateCopilotResponseMutationVariables,
  AvailableAgentsQuery,
  LoadAgentStateQuery,
} from "../graphql/@generated/graphql";

/**
 * Common interface for CopilotKit runtime clients
 */
export interface ICopilotRuntimeClient {
  // Core method signatures that all clients must implement
  generateCopilotResponse(params: {
    data: GenerateCopilotResponseMutationVariables["data"];
    properties?: GenerateCopilotResponseMutationVariables["properties"];
    signal?: AbortSignal;
  }): any;

  asStream<S, T>(source: any): ReadableStream<S>;

  availableAgents(): any;

  loadAgentState(data: { threadId: string; agentName: string }): any;

  // Error handling
  handleGQLErrors?: (error: Error) => void;
  handleGQLWarning?: (warning: string) => void;

  // Client property for compatibility
  client?: any;
}

/**
 * Utility method interface
 */
export interface ICopilotRuntimeClientStatic {
  removeGraphQLTypename(data: any): any;
}