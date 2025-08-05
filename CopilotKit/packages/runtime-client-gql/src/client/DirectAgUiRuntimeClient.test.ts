import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectAgUiRuntimeClient } from './DirectAgUiRuntimeClient';
import { createDirectAgUiRuntimeClient, createCopilotRuntimeClient } from './factory';
import { MessageRole, MessageStatusCode } from '../graphql/@generated/graphql';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DirectAgUiRuntimeClient', () => {
  let client: DirectAgUiRuntimeClient;
  let mockHandleErrors: ReturnType<typeof vi.fn>;
  let mockHandleWarnings: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandleErrors = vi.fn();
    mockHandleWarnings = vi.fn();
    
    client = new DirectAgUiRuntimeClient({
      url: 'https://test-agui-server.com',
      handleGQLErrors: mockHandleErrors,
      handleGQLWarning: mockHandleWarnings,
      headers: {
        'X-Test-Header': 'test-value',
      },
    });

    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(client).toBeInstanceOf(DirectAgUiRuntimeClient);
      expect(client.handleGQLErrors).toBe(mockHandleErrors);
      expect(client.handleGQLWarning).toBe(mockHandleWarnings);
    });

    it('should set up headers correctly', () => {
      const clientWithApiKey = new DirectAgUiRuntimeClient({
        url: 'https://test.com',
        publicApiKey: 'test-api-key',
        headers: {
          'Custom-Header': 'custom-value',
        },
      });

      expect(clientWithApiKey).toBeInstanceOf(DirectAgUiRuntimeClient);
    });
  });

  describe('generateCopilotResponse', () => {
    it('should make a POST request to the correct endpoint', async () => {
      const mockResponse = {
        threadId: 'test-thread',
        runId: 'test-run',
        messages: [],
        metaEvents: [],
        status: { code: 'SUCCESS' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        headers: new Map([['X-CopilotKit-Runtime-Version', '1.0.0']]),
      });

      const testData = {
        messages: [
          {
            id: 'msg-1',
            createdAt: new Date(),
            textMessage: {
              content: 'Hello, world!',
              role: MessageRole.User,
            },
          },
        ],
        threadId: 'test-thread',
        metadata: {
          requestType: 'CHAT' as any,
        },
        frontend: {
          actions: [],
        },
      };

      const result = client.generateCopilotResponse({
        data: testData,
        properties: { test: 'value' },
      });

      // Test the subscription interface
      let receivedData: any;
      result.subscribe(({ data, error, hasNext }: { data?: any; error?: Error; hasNext?: boolean }) => {
        if (data) {
          receivedData = data;
        }
        if (error) {
          throw error;
        }
      });

      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-agui-server.com/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Test-Header': 'test-value',
          }),
          body: expect.stringContaining('"data"'),
        })
      );

      expect(receivedData).toEqual({
        generateCopilotResponse: expect.objectContaining({
          threadId: 'test-thread',
          runId: 'test-run',
        }),
      });
    });

    it('should handle HTTP errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
      });

      const testData = {
        messages: [],
        threadId: 'test-thread',
        metadata: { requestType: 'CHAT' as any },
        frontend: { actions: [] },
      };

      const result = client.generateCopilotResponse({ data: testData });

      let receivedError: Error | null = null;
      result.subscribe(({ data, error }: { data?: any; error?: Error }) => {
        if (error) {
          receivedError = error;
        }
      });

      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(receivedError).toBeInstanceOf(Error);
      expect(mockHandleErrors).toHaveBeenCalled();
    });
  });

  describe('availableAgents', () => {
    it('should make a GET request to the agents endpoint', async () => {
      const mockAgents = {
        agents: [
          { id: 'agent-1', name: 'Test Agent', description: 'A test agent' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAgents),
        headers: new Map([['X-CopilotKit-Runtime-Version', '1.0.0']]),
      });

      const result = client.availableAgents();
      const response = await result.toPromise();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-agui-server.com/agents',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(response.data).toEqual(mockAgents);
    });
  });

  describe('loadAgentState', () => {
    it('should make a POST request to the agent-state endpoint', async () => {
      const mockState = {
        threadId: 'test-thread',
        threadExists: true,
        state: 'active',
        messages: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockState),
        headers: new Map([['X-CopilotKit-Runtime-Version', '1.0.0']]),
      });

      const result = client.loadAgentState({
        threadId: 'test-thread',
        agentName: 'test-agent',
      });

      const response = await result.toPromise();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-agui-server.com/agent-state',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"threadId":"test-thread"'),
        })
      );

      expect(response.data).toEqual(mockState);
    });
  });

  describe('asStream', () => {
    it('should convert subscription source to ReadableStream', async () => {
      const mockSource = {
        subscribe: (observer: any) => {
          setTimeout(() => {
            observer({ data: 'test-data', hasNext: false });
          }, 0);
        },
      };

      const stream = client.asStream(mockSource);
      const reader = stream.getReader();
      
      const result = await reader.read();
      
      expect(result.value).toBe('test-data');
      expect(result.done).toBe(false);
      
      const endResult = await reader.read();
      expect(endResult.done).toBe(true);
    });

    it('should handle errors in stream', async () => {
      const testError = new Error('Stream error');
      const mockSource = {
        subscribe: (observer: any) => {
          setTimeout(() => {
            observer({ error: testError, hasNext: false });
          }, 0);
        },
      };

      const stream = client.asStream(mockSource);
      const reader = stream.getReader();
      
      await expect(reader.read()).rejects.toThrow('Stream error');
      expect(mockHandleErrors).toHaveBeenCalledWith(testError);
    });
  });

  describe('removeGraphQLTypename', () => {
    it('should remove __typename fields from objects', () => {
      const testData = {
        __typename: 'TestType',
        field1: 'value1',
        nested: {
          __typename: 'NestedType',
          field2: 'value2',
        },
        array: [
          {
            __typename: 'ArrayItemType',
            field3: 'value3',
          },
        ],
      };

      const cleaned = DirectAgUiRuntimeClient.removeGraphQLTypename(testData);

      expect(cleaned.__typename).toBeUndefined();
      expect(cleaned.nested.__typename).toBeUndefined();
      expect(cleaned.array[0].__typename).toBeUndefined();
      expect(cleaned.field1).toBe('value1');
      expect(cleaned.nested.field2).toBe('value2');
      expect(cleaned.array[0].field3).toBe('value3');
    });
  });
});

describe('Factory functions', () => {
  it('should create DirectAgUiRuntimeClient with factory', () => {
    const client = createDirectAgUiRuntimeClient({
      url: 'https://test.com',
    });

    expect(client).toBeInstanceOf(DirectAgUiRuntimeClient);
  });

  it('should create correct client type based on mode', () => {
    const directClient = createCopilotRuntimeClient({
      mode: 'direct',
      directConfig: {
        url: 'https://test.com',
      },
    });

    expect(directClient).toBeInstanceOf(DirectAgUiRuntimeClient);
  });

  it('should throw error when config is missing', () => {
    expect(() => {
      createCopilotRuntimeClient({
        mode: 'direct',
        // Missing directConfig
      } as any);
    }).toThrow('directConfig is required when mode is "direct"');
  });
});