import { CopilotRuntimeClient, CopilotRuntimeClientOptions } from "@copilotkit/runtime-client-gql";
import { AgUiClient, AgUiClientOptions } from "./agui-client";

export interface UnifiedClientOptions extends CopilotRuntimeClientOptions {
  aguiServerUrl?: string;
  useAgUi?: boolean;
}

export type UnifiedClient = CopilotRuntimeClient | AgUiClient;

/**
 * Factory function to create either a CopilotRuntimeClient or AgUiClient
 * based on configuration
 */
export function createUnifiedClient(options: UnifiedClientOptions): UnifiedClient {
  // If aguiServerUrl is provided, use AgUiClient
  if (options.aguiServerUrl || options.useAgUi) {
    const aguiOptions: AgUiClientOptions = {
      url: options.aguiServerUrl || options.url,
      publicApiKey: options.publicApiKey,
      headers: options.headers,
      credentials: options.credentials,
      handleErrors: options.handleGQLErrors,
      handleWarning: options.handleGQLWarning,
    };
    return new AgUiClient(aguiOptions);
  }

  // Otherwise, use the standard CopilotRuntimeClient
  return new CopilotRuntimeClient(options);
}

/**
 * Type guard to check if a client is an AgUiClient
 */
export function isAgUiClient(client: UnifiedClient): client is AgUiClient {
  return client instanceof AgUiClient;
}

/**
 * Type guard to check if a client is a CopilotRuntimeClient
 */
export function isCopilotRuntimeClient(client: UnifiedClient): client is CopilotRuntimeClient {
  return client instanceof CopilotRuntimeClient;
}