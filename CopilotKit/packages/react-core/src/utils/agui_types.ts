import { Message as AguiMessage, ToolCall as AguiToolCall } from "@ag-ui/client";

import { Message, Role } from "@copilotkit/runtime-client-gql";

import { FrontendAction } from "../types/frontend-action";

import { CoAgentStateRender } from "../types/coagent-action";

import { randomUUID } from "@copilotkit/shared";

/**

 * Convert CopilotKit internal messages to ag_ui format

 */

export function copilotKitToAgui(
  messages: Message[],
  actions: Record<string, FrontendAction<any>>,
  coAgentStateRenders: Record<string, CoAgentStateRender<any>>,
): AguiMessage[] {
  const aguiMessages: AguiMessage[] = [];

  for (const message of messages) {
    if (message.isTextMessage()) {
      aguiMessages.push({
        id: message.id,

        role: getRoleFromMessage(message),

        content: message.content,
      });
    } else if (message.isActionExecutionMessage()) {
      // Convert action execution to assistant message with tool calls

      const toolCall: AguiToolCall = {
        id: message.id,

        type: "function",

        function: {
          name: message.name,

          arguments: JSON.stringify(message.arguments),
        },
      };

      aguiMessages.push({
        id: randomUUID(),

        role: "assistant",

        content: "",

        toolCalls: [toolCall],
      });
    } else if (message.isResultMessage()) {
      aguiMessages.push({
        id: message.id,

        role: "tool",

        content: message.result,

        toolCallId: message.actionExecutionId,

        // Note: toolName is not part of the standard ag_ui Message interface
      });
    } else if (message.isAgentStateMessage()) {
      aguiMessages.push({
        id: message.id,

        role: "assistant",

        content: "",

        // Note: agentName and state are not part of standard ag_ui Message interface

        // They would need to be handled differently or stored in metadata
      } as any);
    } else if (message.isImageMessage()) {
      aguiMessages.push({
        id: message.id,

        role: getRoleFromMessage(message),

        content: "",

        // Note: image property needs to be handled according to ag_ui Message interface
      } as any);
    }
  }

  return aguiMessages;
}

/**

 * Convert ag_ui messages to CopilotKit internal format

 */

export function aguiToCopilotKit(
  aguiMessages: AguiMessage[],
  actions?: Record<string, FrontendAction<any>>,
  coAgentStateRenders?: Record<string, CoAgentStateRender<any>>,
): Message[] {
  // For now, we'll use a simplified conversion

  // In a real implementation, this would need proper message type conversion

  return aguiMessages.map((msg) => ({
    id: msg.id,

    content: msg.content || "",

    role: msg.role,
  })) as any;
}

/**

 * Convert frontend actions to ag_ui tool format

 */

export function frontendActionsToAguiTools(actions: Record<string, FrontendAction<any>>) {
  return Object.values(actions).map((action) => ({
    type: "function" as const,

    function: {
      name: action.name,

      description: action.description,

      parameters: action.parameters ? convertParametersToSchema(action.parameters) : {},
    },
  }));
}

/**

 * Convert action parameters to JSON schema format expected by ag_ui

 */

function convertParametersToSchema(parameters: any[]): any {
  const properties: Record<string, any> = {};

  const required: string[] = [];

  for (const param of parameters) {
    properties[param.name] = {
      type: param.type || "string",

      description: param.description,
    };

    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: "object",

    properties,

    required,
  };
}

/**

 * Helper to get role from CopilotKit message

 */

function getRoleFromMessage(message: Message): "user" | "assistant" | "system" | "developer" {
  if (message.isTextMessage()) {
    // Map GQL Role enum to ag_ui role strings

    switch (message.role) {
      case Role.User:
        return "user";

      case Role.Assistant:
        return "assistant";

      case Role.System:
        return "system";

      case Role.Developer:
        return "developer";

      default:
        return "user";
    }
  }

  return "assistant"; // Default fallback
}
