import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CopilotRuntimeDirectClient } from "./CopilotRuntimeDirectClient";
import { TextMessage, ActionExecutionMessage, Role } from "./types";

// Mock the AG_UI HttpAgent
vi.mock("@ag-ui/client", () => ({
  HttpAgent: vi.fn().mockImplementation(() => ({
    legacy_to_be_removed_runAgentBridged: vi.fn(),
    messages: [],
  })),
}));

describe("CopilotRuntimeDirectClient", () => {
  let client: CopilotRuntimeDirectClient;
  let mockHttpAgent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    client = new CopilotRuntimeDirectClient({
      url: "http://localhost:8000",
      headers: { "x-test": "header" },
    });

    // Get the mocked HttpAgent instance
    const { HttpAgent } = require("@ag-ui/client");
    mockHttpAgent = new HttpAgent({});
  });

  it("should create instance with correct configuration", () => {
    expect(client).toBeInstanceOf(CopilotRuntimeDirectClient);
  });

  it("should have availableAgents method", async () => {
    const result = await client.availableAgents().toPromise();
    
    expect(result.data.availableAgents).toHaveLength(1);
    expect(result.data.availableAgents[0]).toEqual({
      name: "default",
      description: "AG_UI Agent", 
      agentId: "ag-ui-agent",
    });
  });

  it("should have loadAgentState method", async () => {
    const result = await client.loadAgentState({
      threadId: "test-thread",
      agentName: "test-agent"
    }).toPromise();
    
    expect(result.data.loadAgentState).toEqual({
      state: "{}",
      config: "{}",
    });
  });

  it("should convert AG_UI events to GQL format", () => {
    const textStartEvent = {
      type: "text_message_start",
      messageId: "msg-123"
    };

    // Access the private method for testing
    const converted = (client as any).convertAGUIEventToGQL(textStartEvent);
    
    expect(converted.__typename).toBe("TextMessageOutput");
    expect(converted.id).toBe("msg-123");
    expect(converted.role).toBe("assistant");
  });

  it("should remove GraphQL typename from data", () => {
    const data = {
      __typename: "TestType",
      nested: {
        __typename: "NestedType",
        value: "test"
      },
      array: [
        { __typename: "ArrayType", item: 1 },
        { __typename: "ArrayType", item: 2 }
      ]
    };

    const result = CopilotRuntimeDirectClient.removeGraphQLTypename(data);
    
    expect(result.__typename).toBeUndefined();
    expect(result.nested.__typename).toBeUndefined();
    expect(result.array[0].__typename).toBeUndefined();
    expect(result.array[1].__typename).toBeUndefined();
    expect(result.nested.value).toBe("test");
    expect(result.array[0].item).toBe(1);
  });
});