import { useMemo, useRef } from "react";
import { HttpAgent } from "@ag-ui/client";
import { useToast } from "../components/toast/toast-provider";
import {
  CopilotKitError,
  CopilotKitErrorCode,
  CopilotErrorHandler,
  CopilotErrorEvent,
} from "@copilotkit/shared";
import { shouldShowDevConsole } from "../utils";

// Define AgentSubscriber interface locally since it's not exported from @ag-ui/client
interface AgentSubscriber {
  onRunFailed?: (params: { error: any }) => Promise<void>;
}

export interface CopilotAguiClientsHookOptions {
  endpoints: Record<string, string>;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
  threadId?: string;
  enabled?: boolean;
}


// Add explicit return type interface
export interface CopilotAguiClientsHookReturn {
  aguiClients: Record<string, HttpAgent>;
  errorSubscribers: Record<string, AgentSubscriber>;
  traceUIError: (error: CopilotKitError, originalError?: any, endpoint?: string) => Promise<void>;
  getClientForAgent: (agentName?: string) => HttpAgent | null;
}

export const useCopilotAguiClients = (options: CopilotAguiClientsHookOptions): CopilotAguiClientsHookReturn => {
  const { setBannerError } = useToast();
  const { showDevConsole, onError, threadId, enabled = true, endpoints, ...aguiOptions } = options;

  // Deduplication state for structured errors
  const lastStructuredErrorRef = useRef<{ message: string; timestamp: number } | null>(null);

  // Helper function to trace UI errors
  const traceUIError = async (error: CopilotKitError, originalError?: any, endpoint?: string) => {
    if (!onError) return;

    try {
      const errorEvent: CopilotErrorEvent = {
        type: "error",
        timestamp: Date.now(),
        context: {
          source: "ui",
          request: {
            operation: "aguiClients",
            url: endpoint || "multiple",
            startTime: Date.now(),
          },
          technical: {
            environment: "browser",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            stackTrace: originalError instanceof Error ? originalError.stack : undefined,
          },
        },
        error,
      };
      await onError(errorEvent);
    } catch (error) {
      console.error("Error in onError handler:", error);
    }
  };

  const aguiClients = useMemo(() => {
    if (!enabled || !endpoints || Object.keys(endpoints).length === 0) {
      return {};
    }

    const clients: Record<string, HttpAgent> = {};

    for (const [agentName, url] of Object.entries(endpoints)) {
      clients[agentName] = new HttpAgent({
        url,
        headers: aguiOptions.headers || {},
        agentId: agentName !== 'default' ? agentName : undefined,
        threadId: threadId,
        debug: shouldShowDevConsole(showDevConsole ?? false),
      });
    }

    return clients;
  }, [endpoints, aguiOptions.headers, threadId, showDevConsole, enabled]);

  // Create error subscribers for each client
  const errorSubscribers: Record<string, AgentSubscriber> = useMemo(() => {
    const subscribers: Record<string, AgentSubscriber> = {};

    for (const agentName of Object.keys(aguiClients)) {
      subscribers[agentName] = {
        onRunFailed: async ({ error }: { error: any }) => {
          const isDev = shouldShowDevConsole(showDevConsole ?? false);

          if (!isDev) {
            console.error(`CopilotKit Agui Error for ${agentName} (hidden in production):`, error.message);
            return;
          }

          // Deduplicate to prevent spam
          const now = Date.now();
          const errorMessage = `${agentName}: ${error.message}`;
          if (
            lastStructuredErrorRef.current &&
            lastStructuredErrorRef.current.message === errorMessage &&
            now - lastStructuredErrorRef.current.timestamp < 150
          ) {
            return; // Skip duplicate
          }
          lastStructuredErrorRef.current = { message: errorMessage, timestamp: now };

          const ckError = new CopilotKitError({
            message: `Agent ${agentName}: ${error.message}`,
            code: CopilotKitErrorCode.UNKNOWN,
          });

          setBannerError(ckError);
          await traceUIError(ckError, error, endpoints[agentName]);
        },
      };
    }

    return subscribers;
  }, [aguiClients, setBannerError, showDevConsole, onError, endpoints]);

  // Helper function to get client for specific agent
  const getClientForAgent = (agentName?: string): HttpAgent | null => {
    if (!agentName) {
      // Return default client if available
      return aguiClients['default'] || null;
    }

    // Return specific agent client or default
    return aguiClients[agentName] || aguiClients['default'] || null;
  };

  return {
    aguiClients,
    errorSubscribers,
    traceUIError,
    getClientForAgent,
  };
};