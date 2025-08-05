import { useMemo, useRef } from "react";
import { HttpAgent, AbstractAgent, Message as AguiMessage } from "@ag-ui/client";
import { useToast } from "../components/toast/toast-provider";
import {
  CopilotKitError,
  CopilotKitErrorCode,
  CopilotErrorHandler,
  CopilotErrorEvent,
} from "@copilotkit/shared";
import { shouldShowDevConsole } from "../utils/dev-console";

// Define AgentSubscriber interface locally since it's not exported from @ag-ui/client
interface AgentSubscriber {
  onRunFailed?: (params: { error: any }) => Promise<void>;
}

export interface CopilotAguiClientHookOptions {
  url: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
  agentId?: string;
  threadId?: string;
  enabled?: boolean;
}

export const useCopilotAguiClient = (options: CopilotAguiClientHookOptions) => {
  const { setBannerError } = useToast();
  const { showDevConsole, onError, agentId, threadId, enabled = true, ...aguiOptions } = options;

  // Deduplication state for structured errors
  const lastStructuredErrorRef = useRef<{ message: string; timestamp: number } | null>(null);

  // Helper function to trace UI errors
  const traceUIError = async (error: CopilotKitError, originalError?: any) => {
    if (!onError) return;

    try {
      const errorEvent: CopilotErrorEvent = {
        type: "error",
        timestamp: Date.now(),
        context: {
          source: "ui",
          request: {
            operation: "aguiClient",
            url: aguiOptions.url,
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

  const aguiClient = useMemo(() => {
    if (!enabled || !aguiOptions.url) {
      return null;
    }
    
    return new HttpAgent({
      url: aguiOptions.url,
      headers: aguiOptions.headers || {},
      agentId: agentId,
      threadId: threadId,
      debug: shouldShowDevConsole(showDevConsole ?? false),
    });
  }, [aguiOptions.url, aguiOptions.headers, agentId, threadId, showDevConsole, enabled]);

  // Create a subscriber for handling errors and events
  const errorSubscriber: AgentSubscriber = useMemo(() => ({
    onRunFailed: async ({ error }: { error: any }) => {
      const isDev = shouldShowDevConsole(showDevConsole ?? false);
      
      if (!isDev) {
        console.error("CopilotKit Agui Error (hidden in production):", error.message);
        return;
      }

      // Deduplicate to prevent spam
      const now = Date.now();
      const errorMessage = error.message;
      if (
        lastStructuredErrorRef.current &&
        lastStructuredErrorRef.current.message === errorMessage &&
        now - lastStructuredErrorRef.current.timestamp < 150
      ) {
        return; // Skip duplicate
      }
      lastStructuredErrorRef.current = { message: errorMessage, timestamp: now };

      const ckError = new CopilotKitError({
        message: error.message,
        code: CopilotKitErrorCode.UNKNOWN,
      });
      
      setBannerError(ckError);
      await traceUIError(ckError, error);
    },
  }), [setBannerError, showDevConsole, onError]);

  return {
    aguiClient,
    errorSubscriber,
    traceUIError,
  };
};