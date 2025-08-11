import { AguiRuntimeClient } from '../AguiRuntimeClient';
import { AguiAgentConfig } from '../../types';

describe('AguiRuntimeClient', () => {
  let client: AguiRuntimeClient;
  let mockAgents: AguiAgentConfig[];

  beforeEach(() => {
    mockAgents = [
      {
        name: 'test-agent',
        url: 'http://localhost:8000',
        description: 'Test agent',
      },
    ];

    client = new AguiRuntimeClient({
      agents: mockAgents,
    });

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('constructor', () => {
    it('should initialize with agents', () => {
      expect(client.getAgentNames()).toEqual(['test-agent']);
    });

    it('should handle multiple agents', () => {
      const multiClient = new AguiRuntimeClient({
        agents: [
          { name: 'agent1', url: 'http://localhost:8001' },
          { name: 'agent2', url: 'http://localhost:8002' },
        ],
      });

      expect(multiClient.getAgentNames()).toEqual(['agent1', 'agent2']);
    });
  });

  describe('addAgent', () => {
    it('should add a new agent', () => {
      client.addAgent({
        name: 'new-agent',
        url: 'http://localhost:8001',
      });

      expect(client.getAgentNames()).toContain('new-agent');
    });
  });

  describe('removeAgent', () => {
    it('should remove an existing agent', () => {
      const result = client.removeAgent('test-agent');
      expect(result).toBe(true);
      expect(client.getAgentNames()).not.toContain('test-agent');
    });

    it('should return false for non-existent agent', () => {
      const result = client.removeAgent('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('availableAgents', () => {
    it('should fetch available agents from servers', async () => {
      const mockResponse = [
        { name: 'agent1', id: '1', description: 'Agent 1' },
        { name: 'agent2', id: '2', description: 'Agent 2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const agents = await client.availableAgents();

      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe('agent1');
      expect(agents[1].name).toBe('agent2');
    });

    it('should handle server errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const agents = await client.availableAgents();

      expect(agents).toHaveLength(0);
    });
  });

  describe('loadAgentState', () => {
    it('should load agent state successfully', async () => {
      const mockState = { messages: [], state: {} };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockState,
      });

      const result = await client.loadAgentState({
        threadId: 'test-thread',
        agentName: 'test-agent',
      });

      expect(result.state).toBe(JSON.stringify({}));
      expect(result.messages).toBe(JSON.stringify([]));
    });

    it('should throw error for non-existent agent', async () => {
      await expect(
        client.loadAgentState({
          threadId: 'test-thread',
          agentName: 'non-existent',
        })
      ).rejects.toThrow("Agent 'non-existent' not found");
    });
  });

  describe('generateCopilotResponse', () => {
    it('should require agentName', () => {
      const observable = client.generateCopilotResponse({
        data: {
          messages: [],
        },
      });

      observable.subscribe({
        error: (error) => {
          expect(error.message).toBe('agentName is required for ag_ui direct connection');
        },
      });
    });

    it('should throw error for non-existent agent', () => {
      const observable = client.generateCopilotResponse({
        data: {
          agentName: 'non-existent',
          messages: [],
        },
      });

      observable.subscribe({
        error: (error) => {
          expect(error.message).toContain("Agent 'non-existent' not found");
        },
      });
    });
  });
});

