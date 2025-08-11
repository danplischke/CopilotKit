import { useMemo } from 'react';
import { useToast } from '../components/toast/toast-provider';
import { useCopilotRuntimeClient } from './use-copilot-runtime-client';
import { useAguiRuntimeClient } from './use-agui-runtime-client';
import {
  CopilotKitError,
  CopilotKitErrorCode,
  CopilotErrorHandler,
  CopilotErrorEvent,
} from '@copilotkit/shared';
import { shouldShowDevConsole } from '../utils/dev-console';

export interface UnifiedRuntimeClientOptions {
  // GraphQL client options
  url?: string;
  publicApiKey?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  
  // ag_ui client options
  aguiAgents?: Array<{
    name: string;
    url: string;
    description?: string;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
  }>;
  
  // Common options
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
}

export type UnifiedRuntimeClient = 
  | { type: 'graphql'; client: ReturnType<typeof useCopilotRuntimeClient> }
  | { type: 'agui'; client: ReturnType<typeof useAguiRuntimeClient> };

export function useUnifiedRuntimeClient(options: UnifiedRuntimeClientOptions): UnifiedRuntimeClient {
  const { setBannerError } = useToast();
  const { showDevConsole, onError, aguiAgents, ...graphqlOptions } = options;

  // Determine which client to use based on available options
  const clientType = useMemo(() => {
    if (aguiAgents && aguiAgents.length > 0) {
      return 'agui';
    }
    if (graphqlOptions.url) {
      return 'graphql';
    }
    // Default to GraphQL if no specific configuration is provided
    return 'graphql';
  }, [aguiAgents, graphqlOptions.url]);

  // Call both hooks unconditionally to comply with the Rules of Hooks
  const aguiClient = useAguiRuntimeClient({
    agents: aguiAgents ?? [],
    publicApiKey: graphqlOptions.publicApiKey,
    showDevConsole,
    onError,
  });

  const graphqlClient = useCopilotRuntimeClient({
    url: graphqlOptions.url || '',
    publicApiKey: graphqlOptions.publicApiKey,
    headers: graphqlOptions.headers,
    credentials: graphqlOptions.credentials,
    showDevConsole,
    onError,
  });

  return clientType === 'agui'
    ? { type: 'agui', client: aguiClient }
    : { type: 'graphql', client: graphqlClient };
}

// Helper function to get the appropriate client from the unified client
export function getRuntimeClient(unifiedClient: UnifiedRuntimeClient) {
  return unifiedClient.client;
}

// Helper function to check if the client is ag_ui type
export function isAguiClient(unifiedClient: UnifiedRuntimeClient): unifiedClient is { type: 'agui'; client: any } {
  return unifiedClient.type === 'agui';
}

// Helper function to check if the client is GraphQL type
export function isGraphQLClient(unifiedClient: UnifiedRuntimeClient): unifiedClient is { type: 'graphql'; client: any } {
  return unifiedClient.type === 'graphql';
}
