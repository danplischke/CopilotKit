import { useMemo } from 'react';
import { useToast } from '../components/toast/toast-provider';
import { AguiRuntimeClient, AguiRuntimeClientOptions } from '@copilotkit/runtime-client-agui';
import {
  CopilotKitError,
  CopilotKitErrorCode,
  CopilotErrorHandler,
  CopilotErrorEvent,
} from '@copilotkit/shared';

export interface UseAguiRuntimeClientOptions extends AguiRuntimeClientOptions {
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
}

export function useAguiRuntimeClient(options: UseAguiRuntimeClientOptions) {
  const { setBannerError } = useToast();
  const { showDevConsole, onError, ...runtimeOptions } = options;

  const runtimeClient = useMemo(() => {
    return new AguiRuntimeClient({
      ...runtimeOptions,
      handleErrors: (error) => {
        if (onError && runtimeOptions.publicApiKey) {
          const errorEvent: CopilotErrorEvent = {
            type: "error",
            timestamp: Date.now(),
            context: {
              source: "ui",
              request: {
                operation: "aguiRuntimeClient",
                startTime: Date.now(),
              },
              technical: {
                environment: "browser",
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                stackTrace: error instanceof Error ? error.stack : undefined,
              },
            },
            error: error instanceof CopilotKitError ? error : new CopilotKitError({
              message: error.message,
              code: CopilotKitErrorCode.UNKNOWN,
            }),
          };
          onError(errorEvent);
        }

        if (error instanceof CopilotKitError) {
          setBannerError(error);
        } else {
          setBannerError(new CopilotKitError({
            message: error.message,
            code: CopilotKitErrorCode.UNKNOWN,
          }));
        }
      },
      handleWarning: (warning) => {
        console.warn('AguiRuntimeClient Warning:', warning);
      },
    });
  }, [runtimeOptions, onError, setBannerError]);

  return runtimeClient;
}

