// Setup file for Jest tests

// Mock fetch globally
global.fetch = jest.fn();

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  abort: jest.fn(),
  signal: {},
}));

// Mock ReadableStream
global.ReadableStream = jest.fn().mockImplementation(() => ({
  getReader: jest.fn().mockReturnValue({
    read: jest.fn().mockResolvedValue({ done: true }),
  }),
}));
