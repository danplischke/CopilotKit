import { GenerateCopilotResponseMutationVariables } from "@copilotkit/runtime-client-gql";

/**
 * Interface that defines the contract for CopilotKit clients
 * This interface is designed to be flexible enough to accommodate different return types
 */
export interface ICopilotClient {
  /**
   * Generate a copilot response
   */
  generateCopilotResponse(params: {
    data: GenerateCopilotResponseMutationVariables["data"];
    properties?: GenerateCopilotResponseMutationVariables["properties"];
    signal?: AbortSignal;
  }): any;

  /**
   * Get available agents - can return Promise or urql OperationResultSource
   */
  availableAgents(): any;

  /**
   * Load agent state - can return Promise or urql OperationResultSource
   */
  loadAgentState(data: { threadId: string; agentName: string }): any;

  /**
   * Convert a source to a readable stream
   */
  asStream<S, T>(source: any): ReadableStream<S>;
}