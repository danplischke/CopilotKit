import { CopilotRuntimeClient, CopilotRuntimeClientOptions } from "@copilotkit/runtime-client-gql";
import { AgUiClient, AgUiClientOptions } from "./agui-client";
import { ICopilotClient } from "./ICopilotClient";

export interface UnifiedClientOptions extends CopilotRuntimeClientOptions {
  aguiServerUrl?: string;
  useAgUi?: boolean;
}

/**
 * Factory function to create either a CopilotRuntimeClient or AgUiClient
 * based on configuration. Both implement ICopilotClient interface.
 */
export function createUnifiedClient(options: UnifiedClientOptions): ICopilotClient {
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
  // CopilotRuntimeClient has the same interface as ICopilotClient
  return new CopilotRuntimeClient(options);
}

/**
 * Type guard to check if a client is an AgUiClient
 */
export function isAgUiClient(client: any): client is AgUiClient {
  return client instanceof AgUiClient;
}

/**
 * Type guard to check if a client is a CopilotRuntimeClient
 */
export function isCopilotRuntimeClient(client: any): client is CopilotRuntimeClient {
  return client instanceof CopilotRuntimeClient;
}