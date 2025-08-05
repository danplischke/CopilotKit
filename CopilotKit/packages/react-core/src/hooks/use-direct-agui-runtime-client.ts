import {
  DirectAgUiRuntimeClient,
  DirectAgUiRuntimeClientOptions,
} from "@copilotkit/runtime-client-gql";
import { useToast } from "../components/toast/toast-provider";
import { useMemo, useRef } from "react";
import {
  ErrorVisibility,
  CopilotKitApiDiscoveryError,
  CopilotKitRemoteEndpointDiscoveryError,
  CopilotKitAgentDiscoveryError,
  CopilotKitError,
  CopilotKitErrorCode,
  CopilotErrorHandler,
  CopilotErrorEvent,
} from "@copilotkit/shared";
import { shouldShowDevConsole } from "../utils/dev-console";

export interface DirectAgUiClientHookOptions extends DirectAgUiRuntimeClientOptions {
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
}

/**
 * Hook for creating a DirectAgUiRuntimeClient that communicates directly with ag_ui servers
 * bypassing the GraphQL proxy layer.
 */
export const useDirectAgUiRuntimeClient = (options: DirectAgUiClientHookOptions): DirectAgUiRuntimeClient => {
  const { setBannerError } = useToast();
  const { showDevConsole, onError, ...runtimeOptions } = options;

  // Deduplication state for structured errors
  const lastStructuredErrorRef = useRef<{ message: string; timestamp: number } | null>(null);

  // Helper function to trace UI errors
  const traceUIError = async (error: CopilotKitError, originalError?: any) => {
    // Just check if onError and publicApiKey are defined
    if (!onError || !runtimeOptions.publicApiKey) return;

    try {
      const errorEvent: CopilotErrorEvent = {
        type: "error",
        timestamp: Date.now(),
        context: {
          source: "ui",
          request: {
            operation: "directAgUiClient",
            url: runtimeOptions.url,
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

  const runtimeClient = useMemo(() => {
    const handleGQLErrors = (error: Error) => {
      // Handle both GraphQL-style errors and direct errors
      if ((error as any).graphQLErrors?.length) {
        const graphQLErrors = (error as any).graphQLErrors;

        // Route all errors to banners for consistent UI
        const routeError = (gqlError: any) => {
          const extensions = gqlError.extensions;
          const visibility = extensions?.visibility as ErrorVisibility;
          const isDev = shouldShowDevConsole(showDevConsole ?? false);

          // Silent errors - just log
          if (visibility === ErrorVisibility.SILENT) {
            console.error("CopilotKit Silent Error:", gqlError.message);
            return;
          }

          if (!isDev) {
            console.error("CopilotKit Error (hidden in production):", gqlError.message);
            return;
          }

          // All errors (including DEV_ONLY) show as banners for consistency
          // Deduplicate to prevent spam
          const now = Date.now();
          const errorMessage = gqlError.message;
          if (
            lastStructuredErrorRef.current &&
            lastStructuredErrorRef.current.message === errorMessage &&
            now - lastStructuredErrorRef.current.timestamp < 150
          ) {
            return; // Skip duplicate
          }
          lastStructuredErrorRef.current = { message: errorMessage, timestamp: now };

          const ckError = createStructuredError(gqlError);
          if (ckError) {
            setBannerError(ckError);
            // Trace the error
            traceUIError(ckError, gqlError);
          } else {
            // Fallback for unstructured errors
            const fallbackError = new CopilotKitError({
              message: gqlError.message,
              code: CopilotKitErrorCode.UNKNOWN,
            });
            setBannerError(fallbackError);
            // Trace the fallback error
            traceUIError(fallbackError, gqlError);
          }
        };

        // Process all errors as banners
        graphQLErrors.forEach(routeError);
      } else {
        const isDev = shouldShowDevConsole(showDevConsole ?? false);
        if (!isDev) {
          console.error("CopilotKit Error (hidden in production):", error);
        } else {
          // Route direct errors to banner as well
          const fallbackError = new CopilotKitError({
            message: error?.message || String(error),
            code: CopilotKitErrorCode.UNKNOWN,
          });
          setBannerError(fallbackError);
          // Trace the direct error
          traceUIError(fallbackError, error);
        }
      }
    };

    const handleGQLWarning = (message: string) => {
      console.warn(message);
      // Show warnings as banners too for consistency
      const warningError = new CopilotKitError({
        message,
        code: CopilotKitErrorCode.UNKNOWN,
      });
      setBannerError(warningError);
    };

    return new DirectAgUiRuntimeClient({
      ...runtimeOptions,
      handleGQLErrors,
      handleGQLWarning,
    });
  }, [runtimeOptions, setBannerError, showDevConsole, onError]);

  return runtimeClient;
};

// Create appropriate structured error from GraphQL error
function createStructuredError(gqlError: any): CopilotKitError | null {
  const extensions = gqlError.extensions;
  const originalError = extensions?.originalError as any;
  const message = originalError?.message || gqlError.message;
  const code = extensions?.code as CopilotKitErrorCode;

  if (code) {
    return new CopilotKitError({ message, code });
  }

  // Legacy error detection by stack trace
  if (originalError?.stack?.includes("CopilotApiDiscoveryError")) {
    return new CopilotKitApiDiscoveryError({ message });
  }
  if (originalError?.stack?.includes("CopilotKitRemoteEndpointDiscoveryError")) {
    return new CopilotKitRemoteEndpointDiscoveryError({ message });
  }
  if (originalError?.stack?.includes("CopilotKitAgentDiscoveryError")) {
    return new CopilotKitAgentDiscoveryError({
      agentName: "",
      availableAgents: [],
    });
  }

  return null;
}