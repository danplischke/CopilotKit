import { renderHook } from "@testing-library/react";
import { useCopilotAguiClients } from "../use-copilot-agui-clients";

// Mock @ag-ui/client
jest.mock("@ag-ui/client", () => ({
  HttpAgent: jest.fn().mockImplementation((config) => ({
    url: config.url,
    agentId: config.agentId,
    threadId: config.threadId,
    debug: config.debug,
  })),
}));

// Mock toast provider
jest.mock("../../components/toast/toast-provider", () => ({
  useToast: () => ({
    setBannerError: jest.fn(),
  }),
}));

describe("useCopilotAguiClients", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create multiple ag_ui clients for different endpoints", () => {
    const endpoints = {
      "agent1": "http://localhost:8000",
      "agent2": "http://localhost:8001",
      "default": "http://localhost:8002",
    };

    const { result } = renderHook(() =>
      useCopilotAguiClients({
        endpoints,
        enabled: true,
      })
    );

    expect(result.current.aguiClients).toHaveProperty("agent1");
    expect(result.current.aguiClients).toHaveProperty("agent2");
    expect(result.current.aguiClients).toHaveProperty("default");
  });

  it("should return the correct client for an agent", () => {
    const endpoints = {
      "agent1": "http://localhost:8000",
      "agent2": "http://localhost:8001",
      "default": "http://localhost:8002",
    };

    const { result } = renderHook(() =>
      useCopilotAguiClients({
        endpoints,
        enabled: true,
      })
    );

    const agent1Client = result.current.getClientForAgent("agent1");
    const agent2Client = result.current.getClientForAgent("agent2");
    const defaultClient = result.current.getClientForAgent("unknown");
    const noAgentClient = result.current.getClientForAgent();

    expect(agent1Client).toBe(result.current.aguiClients["agent1"]);
    expect(agent2Client).toBe(result.current.aguiClients["agent2"]);
    expect(defaultClient).toBe(result.current.aguiClients["default"]);
    expect(noAgentClient).toBe(result.current.aguiClients["default"]);
  });

  it("should return empty clients when disabled", () => {
    const endpoints = {
      "agent1": "http://localhost:8000",
    };

    const { result } = renderHook(() =>
      useCopilotAguiClients({
        endpoints,
        enabled: false,
      })
    );

    expect(Object.keys(result.current.aguiClients)).toHaveLength(0);
  });

  it("should return empty clients when no endpoints provided", () => {
    const { result } = renderHook(() =>
      useCopilotAguiClients({
        endpoints: {},
        enabled: true,
      })
    );

    expect(Object.keys(result.current.aguiClients)).toHaveLength(0);
  });
});