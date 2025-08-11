// Re-export ag_ui types for better integration with react-core
export type {
  AguiAgentConfig,
  AguiRuntimeClientOptions,
  GenerateCopilotResponseData,
  AvailableAgent,
  LoadAgentStateData,
  LoadAgentStateResponse,
} from '@copilotkit/runtime-client-agui';

export {
  convertMessagesToAgui,
  convertMessagesFromAgui,
  convertToAguiMessage,
  convertFromAguiMessage,
} from '@copilotkit/runtime-client-agui';

// Re-export the React hook
export { useAguiRuntimeClient, type UseAguiRuntimeClientOptions } from '../hooks/use-agui-runtime-client';
