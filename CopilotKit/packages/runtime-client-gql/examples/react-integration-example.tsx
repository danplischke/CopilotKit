/**
 * React Integration Example for CopilotRuntimeDirectClient
 * 
 * This example shows how to integrate the direct AG_UI client
 * with React components and CopilotKit's existing ecosystem.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CopilotRuntimeDirectClient } from '@copilotkit/runtime-client-gql';
import { TextMessage, Role } from '@copilotkit/runtime-client-gql';

// Custom hook for managing direct AG_UI client
export function useDirectAGUIClient(url: string, options?: {
  headers?: Record<string, string>;
  onError?: (error: Error) => void;
  onWarning?: (warning: string) => void;
}) {
  const [client, setClient] = useState<CopilotRuntimeDirectClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const directClient = new CopilotRuntimeDirectClient({
        url,
        headers: options?.headers,
        handleErrors: (err) => {
          setError(err);
          options?.onError?.(err);
        },
        handleWarning: options?.onWarning,
      });

      setClient(directClient);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setIsConnected(false);
    }
  }, [url, options?.headers]);

  return { client, isConnected, error };
}

// Chat message component
interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => (
  <div className={`message ${message.role}`}>
    <div className="message-header">
      <span className="role">{message.role}</span>
      <span className="timestamp">{message.timestamp.toLocaleTimeString()}</span>
    </div>
    <div className="message-content">{message.content}</div>
  </div>
);

// Streaming response component
interface StreamingResponseProps {
  content: string;
  isComplete: boolean;
}

const StreamingResponse: React.FC<StreamingResponseProps> = ({ content, isComplete }) => (
  <div className={`streaming-response ${isComplete ? 'complete' : 'streaming'}`}>
    <div className="content">{content}</div>
    {!isComplete && <div className="cursor">▊</div>}
  </div>
);

// Main chat component using direct AG_UI client
export const DirectAGUIChatComponent: React.FC = () => {
  const AG_UI_URL = process.env.REACT_APP_AG_UI_URL || 'http://localhost:8000';
  
  const { client, isConnected, error } = useDirectAGUIClient(AG_UI_URL, {
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_AG_UI_TOKEN || ''}`,
    },
    onError: (err) => console.error('AG_UI Error:', err),
    onWarning: (warning) => console.warn('AG_UI Warning:', warning),
  });

  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Available actions for the AG_UI agent
  const availableActions = [
    {
      name: 'search_web',
      description: 'Search the web for information',
      jsonSchema: JSON.stringify({
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      })
    },
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      jsonSchema: JSON.stringify({
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Math expression' }
        },
        required: ['expression']
      })
    }
  ];

  const sendMessage = useCallback(async () => {
    if (!client || !inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Convert to CopilotKit message format
      const copilotMessages = [
        ...messages.map(msg => new TextMessage({
          role: msg.role === 'user' ? Role.User : Role.Assistant,
          content: msg.content,
        })),
        new TextMessage({
          role: Role.User,
          content: userMessage.content,
        })
      ];

      // Generate response using direct AG_UI client
      const response = client.generateCopilotResponse({
        data: {
          messages: copilotMessages,
          actions: availableActions,
          metadata: {
            sessionId: 'react-chat-session',
            userId: 'demo-user',
          }
        },
        properties: {
          temperature: 0.7,
          maxTokens: 1000,
        }
      });

      let assistantMessageId = `assistant-${Date.now()}`;
      let fullContent = '';

      // Handle streaming response
      response.subscribe({
        next: ({ data }) => {
          if (data.__typename === 'TextMessageOutput') {
            if (data.content) {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }

            // Handle message completion
            if (data.status?.code === 'SUCCESS') {
              setIsStreaming(false);
              setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date(),
              }]);
              setStreamingContent('');
            }
          } else if (data.__typename === 'ActionExecutionMessageOutput') {
            console.log('Action executed:', data.name, data.arguments);
            // You could show action execution status in the UI
          }
        },
        error: (err) => {
          console.error('Streaming error:', err);
          setIsStreaming(false);
          setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          }]);
        },
        complete: () => {
          setIsLoading(false);
          setIsStreaming(false);
          if (fullContent && !messages.some(m => m.id === assistantMessageId)) {
            setMessages(prev => [...prev, {
              id: assistantMessageId,
              role: 'assistant',
              content: fullContent,
              timestamp: new Date(),
            }]);
          }
          setStreamingContent('');
        }
      });

    } catch (err) {
      console.error('Send message error:', err);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [client, inputValue, isLoading, messages, availableActions]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (error) {
    return (
      <div className="error-state">
        <h3>Connection Error</h3>
        <p>Failed to connect to AG_UI server: {error.message}</p>
        <p>Please check that your AG_UI server is running at {AG_UI_URL}</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="loading-state">
        <p>Connecting to AG_UI server...</p>
      </div>
    );
  }

  return (
    <div className="direct-agui-chat">
      <div className="chat-header">
        <h2>Direct AG_UI Chat</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isStreaming && (
          <div className="message assistant">
            <div className="message-header">
              <span className="role">assistant</span>
              <span className="timestamp">streaming...</span>
            </div>
            <StreamingResponse content={streamingContent} isComplete={false} />
          </div>
        )}
      </div>

      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Enter to send)"
          disabled={isLoading}
          rows={3}
        />
        <button 
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="chat-info">
        <p>Direct connection to AG_UI server at {AG_UI_URL}</p>
        <p>Available actions: {availableActions.map(a => a.name).join(', ')}</p>
      </div>
    </div>
  );
};

// Provider component for managing multiple direct clients
interface DirectAGUIProviderProps {
  children: React.ReactNode;
  defaultUrl?: string;
  defaultHeaders?: Record<string, string>;
}

const DirectAGUIContext = React.createContext<{
  client: CopilotRuntimeDirectClient | null;
  isConnected: boolean;
  error: Error | null;
  switchServer: (url: string, headers?: Record<string, string>) => void;
} | null>(null);

export const DirectAGUIProvider: React.FC<DirectAGUIProviderProps> = ({ 
  children, 
  defaultUrl = 'http://localhost:8000',
  defaultHeaders 
}) => {
  const [url, setUrl] = useState(defaultUrl);
  const [headers, setHeaders] = useState(defaultHeaders);
  
  const { client, isConnected, error } = useDirectAGUIClient(url, { headers });

  const switchServer = useCallback((newUrl: string, newHeaders?: Record<string, string>) => {
    setUrl(newUrl);
    setHeaders(newHeaders);
  }, []);

  return (
    <DirectAGUIContext.Provider value={{ client, isConnected, error, switchServer }}>
      {children}
    </DirectAGUIContext.Provider>
  );
};

export const useDirectAGUIContext = () => {
  const context = React.useContext(DirectAGUIContext);
  if (!context) {
    throw new Error('useDirectAGUIContext must be used within a DirectAGUIProvider');
  }
  return context;
};

// Example usage in App component
export const ExampleApp: React.FC = () => (
  <DirectAGUIProvider 
    defaultUrl={process.env.REACT_APP_AG_UI_URL || 'http://localhost:8000'}
    defaultHeaders={{
      'Authorization': `Bearer ${process.env.REACT_APP_AG_UI_TOKEN || ''}`,
      'Content-Type': 'application/json',
    }}
  >
    <div className="app">
      <DirectAGUIChatComponent />
    </div>
  </DirectAGUIProvider>
);

// CSS styles (you would put this in a separate .css file)
export const styles = `
.direct-agui-chat {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.connected {
  background-color: #4caf50;
}

.status-indicator.disconnected {
  background-color: #f44336;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
}

.message.user {
  background-color: #e3f2fd;
  margin-left: 20%;
}

.message.assistant {
  background-color: #f5f5f5;
  margin-right: 20%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #666;
  margin-bottom: 5px;
}

.message-content {
  line-height: 1.4;
}

.streaming-response {
  position: relative;
}

.streaming-response .cursor {
  display: inline-block;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.chat-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.chat-input textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.send-button {
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.chat-info {
  font-size: 0.9em;
  color: #666;
  text-align: center;
}

.error-state, .loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-state h3 {
  color: #f44336;
}
`;