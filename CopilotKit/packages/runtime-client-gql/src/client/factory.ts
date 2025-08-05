import { CopilotRuntimeClient, CopilotRuntimeClientOptions } from "./CopilotRuntimeClient";
import { DirectAgUiRuntimeClient, DirectAgUiRuntimeClientOptions, DirectAgUiConfig } from "./DirectAgUiRuntimeClient";
import { ICopilotRuntimeClient } from "./interfaces";

export type CopilotRuntimeClientMode = 'graphql' | 'direct';

export interface CopilotRuntimeClientFactoryOptions {
  mode: CopilotRuntimeClientMode;
  graphqlConfig?: CopilotRuntimeClientOptions;
  directConfig?: DirectAgUiRuntimeClientOptions;
}

/**
 * Factory function to create either a GraphQL-based or Direct AgUI runtime client
 */
export function createCopilotRuntimeClient(options: CopilotRuntimeClientFactoryOptions): ICopilotRuntimeClient {
  if (options.mode === 'direct') {
    if (!options.directConfig) {
      throw new Error('directConfig is required when mode is "direct"');
    }
    return new DirectAgUiRuntimeClient(options.directConfig);
  } else {
    if (!options.graphqlConfig) {
      throw new Error('graphqlConfig is required when mode is "graphql"');
    }
    return new CopilotRuntimeClient(options.graphqlConfig);
  }
}

/**
 * Simplified factory for backward compatibility - defaults to GraphQL mode
 */
export function createGraphQLRuntimeClient(options: CopilotRuntimeClientOptions): CopilotRuntimeClient {
  return new CopilotRuntimeClient(options);
}

/**
 * Factory for creating direct AgUI client
 */
export function createDirectAgUiRuntimeClient(options: DirectAgUiRuntimeClientOptions): DirectAgUiRuntimeClient {
  return new DirectAgUiRuntimeClient(options);
}

/**
 * Type guard to check if a client is a DirectAgUiRuntimeClient
 */
export function isDirectAgUiRuntimeClient(client: any): client is DirectAgUiRuntimeClient {
  return client instanceof DirectAgUiRuntimeClient;
}

/**
 * Type guard to check if a client is a GraphQL CopilotRuntimeClient
 */
export function isGraphQLRuntimeClient(client: any): client is CopilotRuntimeClient {
  return client instanceof CopilotRuntimeClient;
}

// Re-export types for convenience
export type { DirectAgUiConfig, DirectAgUiRuntimeClientOptions };