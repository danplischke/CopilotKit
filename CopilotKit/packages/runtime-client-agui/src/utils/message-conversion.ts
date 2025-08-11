import { Message as AguiMessage } from '@ag-ui/client';

/**
 * Convert CopilotKit message format to ag_ui message format
 */
export function convertToAguiMessage(message: any): AguiMessage {
  const baseMessage: any = {
    id: message.id,
    role: message.role,
    content: message.content || '',
  };

  // Handle tool calls
  if (message.toolCalls && Array.isArray(message.toolCalls)) {
    baseMessage.toolCalls = message.toolCalls.map((toolCall: any) => ({
      id: toolCall.id,
      function: {
        name: toolCall.name,
        arguments: toolCall.arguments || toolCall.args || '{}',
      },
    }));
  }

  // Handle agent state messages
  if (message.agentName && message.state) {
    baseMessage.agentName = message.agentName;
    baseMessage.state = message.state;
  }

  // Handle generative UI
  if (message.generativeUI) {
    baseMessage.generativeUI = message.generativeUI;
  }

  // Handle tool results
  if (message.role === 'tool' && message.result) {
    baseMessage.content = message.result;
  }

  return baseMessage as AguiMessage;
}

/**
 * Convert ag_ui message format to CopilotKit message format
 */
export function convertFromAguiMessage(message: AguiMessage): any {
  const baseMessage: any = {
    id: message.id,
    role: message.role,
    content: message.content || '',
  };

  const messageAny = message as any;

  // Handle tool calls (non-standard extension on some roles)
  if (messageAny.toolCalls && Array.isArray(messageAny.toolCalls)) {
    baseMessage.toolCalls = messageAny.toolCalls.map((toolCall: any) => ({
      id: toolCall.id,
      name: toolCall.function?.name,
      arguments: toolCall.function?.arguments || '{}',
    }));
  }

  // Handle agent state messages (custom fields)
  if (messageAny.agentName && messageAny.state) {
    baseMessage.agentName = messageAny.agentName;
    baseMessage.state = messageAny.state;
  }

  // Handle generative UI (custom field)
  if (messageAny.generativeUI) {
    baseMessage.generativeUI = messageAny.generativeUI;
  }

  return baseMessage;
}

/**
 * Convert an array of CopilotKit messages to ag_ui messages
 */
export function convertMessagesToAgui(messages: any[]): AguiMessage[] {
  return messages.map(convertToAguiMessage);
}

/**
 * Convert an array of ag_ui messages to CopilotKit messages
 */
export function convertMessagesFromAgui(messages: AguiMessage[]): any[] {
  return messages.map(convertFromAguiMessage);
}

