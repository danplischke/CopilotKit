export interface AguiAgentConfig {
  name: string;
  url: string;
  description?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface AguiRuntimeClientOptions {
  agents: AguiAgentConfig[];
  publicApiKey?: string;
  handleErrors?: (error: Error) => void;
  handleWarning?: (warning: string) => void;
}

export interface GenerateCopilotResponseData {
  messages: any[];
  actions?: any[];
  threadId?: string;
  runId?: string;
  agentName?: string;
  properties?: Record<string, any>;
  forwardedParameters?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    toolChoice?: string;
    [key: string]: any;
  };
}

export interface AvailableAgent {
  name: string;
  id: string;
  description: string;
}

export interface LoadAgentStateData {
  threadId: string;
  agentName: string;
}

export interface LoadAgentStateResponse {
  state: string;
  messages: string;
}

