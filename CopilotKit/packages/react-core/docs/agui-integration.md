# ag_ui Integration with CopilotKit

This document explains how to use the new ag_ui runtime client integration with CopilotKit, which allows direct connection to ag_ui servers without requiring a GraphQL proxy layer.

## Overview

The ag_ui integration provides a seamless way to connect CopilotKit applications directly to ag_ui servers, bypassing the traditional GraphQL proxy architecture. This enables:

- **Direct Communication**: Frontend → ag_ui Server (no proxy needed)
- **Multi-Agent Support**: Configure multiple agents with different server URLs
- **Type Safety**: Full TypeScript support throughout the integration
- **Seamless Integration**: Works with existing CopilotKit components and hooks

## Architecture Comparison

### Traditional CopilotKit Flow
```
Frontend → GraphQL Proxy → ag_ui Server
```

### With ag_ui Integration
```
Frontend → ag_ui Server (direct)
```

## Installation

The ag_ui integration is included in the `@copilotkit/react-core` package. No additional installation is required.

## Basic Usage

### 1. Configure ag_ui Agents

```tsx
import { CopilotKit } from '@copilotkit/react-core';

function App() {
  return (
    <CopilotKit
      aguiAgents={[
        {
          name: 'support',
          url: 'http://localhost:8000',
          description: 'Customer support agent',
        },
        {
          name: 'technical',
          url: 'http://localhost:8001',
          description: 'Technical assistant',
        },
      ]}
    >
      {/* Your app components */}
    </CopilotKit>
  );
}
```

### 2. Use with Chat Components

```tsx
import { CopilotChat } from '@copilotkit/react-ui';

function ChatComponent() {
  return (
    <CopilotChat
      agentName="support" // Specify which agent to use
      labels={{
        title: 'Support Assistant',
        initial: 'Hello! How can I help you today?',
      }}
    />
  );
}
```

### 3. Use with Hooks

```tsx
import { useCopilotChat } from '@copilotkit/react-core';

function CustomChatComponent() {
  const { sendMessage, messages, isLoading } = useCopilotChat({
    agentName: 'technical', // Specify which agent to use
  });

  const handleSendMessage = async (content: string) => {
    await sendMessage({
      id: 'user-1',
      role: 'user',
      content,
    });
  };

  return (
    <div>
      {/* Your custom chat UI */}
    </div>
  );
}
```

## Advanced Configuration

### Authentication and Headers

```tsx
<CopilotKit
  aguiAgents={[
    {
      name: 'secure-agent',
      url: 'https://secure-server.example.com',
      description: 'Secure agent with authentication',
      headers: {
        'Authorization': 'Bearer your-api-key',
        'X-Custom-Header': 'custom-value',
      },
      credentials: 'include', // For cookies
    },
  ]}
  publicApiKey="your-public-api-key"
  showDevConsole={true}
>
  {/* Your app */}
</CopilotKit>
```

### Dynamic Agent Management

```tsx
import { useState } from 'react';
import { useUnifiedRuntimeClient } from '@copilotkit/react-core';

function DynamicAgentComponent() {
  const [agents, setAgents] = useState([
    {
      name: 'default',
      url: 'http://localhost:8000',
      description: 'Default agent',
    },
  ]);

  const addAgent = () => {
    const newAgent = {
      name: `agent-${Date.now()}`,
      url: `http://localhost:${8000 + agents.length}`,
      description: `Dynamic agent ${agents.length + 1}`,
    };
    setAgents([...agents, newAgent]);
  };

  return (
    <CopilotKit aguiAgents={agents}>
      <button onClick={addAgent}>Add Agent</button>
      {/* Your chat components */}
    </CopilotKit>
  );
}
```

## API Reference

### CopilotKit Props

#### `aguiAgents`

Configuration for direct ag_ui server connections.

```typescript
interface AguiAgentConfig {
  name: string;                    // Unique agent name
  url: string;                     // ag_ui server URL
  description?: string;            // Optional description
  headers?: Record<string, string>; // Optional headers
  credentials?: RequestCredentials; // Optional credentials
}

aguiAgents?: AguiAgentConfig[];
```

### Hooks

#### `useUnifiedRuntimeClient`

A hook that provides a unified runtime client that can handle both GraphQL and ag_ui connections.

```typescript
const unifiedClient = useUnifiedRuntimeClient({
  // GraphQL options
  url?: string;
  publicApiKey?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  
  // ag_ui options
  aguiAgents?: AguiAgentConfig[];
  
  // Common options
  showDevConsole?: boolean;
  onError?: CopilotErrorHandler;
});
```

#### `useCopilotChat`

The existing `useCopilotChat` hook now supports ag_ui agents through the `agentName` option.

```typescript
const { sendMessage, messages, isLoading } = useCopilotChat({
  agentName: 'support', // Specify which ag_ui agent to use
});
```

### Utility Functions

#### `getRuntimeClient`

Extract the runtime client from a unified client.

```typescript
const runtimeClient = getRuntimeClient(unifiedClient);
```

#### `isAguiClient` / `isGraphQLClient`

Type guards to check the client type.

```typescript
if (isAguiClient(unifiedClient)) {
  // Handle ag_ui specific logic
} else if (isGraphQLClient(unifiedClient)) {
  // Handle GraphQL specific logic
}
```

## Message Conversion

The integration includes utilities for converting between CopilotKit and ag_ui message formats:

```typescript
import { 
  convertMessagesToAgui, 
  convertMessagesFromAgui 
} from '@copilotkit/react-core';

// Convert CopilotKit messages to ag_ui format
const aguiMessages = convertMessagesToAgui(copilotKitMessages);

// Convert ag_ui messages to CopilotKit format
const copilotKitMessages = convertMessagesFromAgui(aguiMessages);
```

## Error Handling

The integration provides comprehensive error handling:

- **Network Errors**: Automatically handled and displayed
- **Authentication Errors**: Proper error messages for auth failures
- **Agent Not Found**: Clear error when specified agent doesn't exist
- **Server Errors**: Graceful handling of server-side errors

Errors are automatically converted to CopilotKit error types and can be handled through the error handler or displayed in the UI.

## Type Safety

The integration provides full TypeScript support:

- **Agent Configuration**: Type-safe agent configuration
- **Message Conversion**: Type-safe message format conversion
- **Client Types**: Proper typing for both GraphQL and ag_ui clients
- **Hook Integration**: Type-safe integration with existing hooks

## Migration Guide

### From GraphQL Proxy to ag_ui Direct

1. **Replace runtimeUrl with aguiAgents**:

```tsx
// Before (GraphQL proxy)
<CopilotKit runtimeUrl="http://localhost:3000/api/copilotkit">

// After (ag_ui direct)
<CopilotKit aguiAgents={[
  {
    name: 'main',
    url: 'http://localhost:8000',
    description: 'Main agent',
  },
]}>
```

2. **Update agent references**:

```tsx
// Before
const { sendMessage } = useCopilotChat();

// After
const { sendMessage } = useCopilotChat({
  agentName: 'main', // Specify the agent name
});
```

3. **Update authentication**:

```tsx
// Before
<CopilotKit 
  runtimeUrl="http://localhost:3000/api/copilotkit"
  headers={{ 'Authorization': 'Bearer token' }}
>

// After
<CopilotKit 
  aguiAgents={[
    {
      name: 'main',
      url: 'http://localhost:8000',
      headers: { 'Authorization': 'Bearer token' },
    },
  ]}
>
```

## Examples

### Basic Multi-Agent Chat

```tsx
import React, { useState } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';

function MultiAgentChat() {
  const [selectedAgent, setSelectedAgent] = useState('support');

  return (
    <CopilotKit
      aguiAgents={[
        { name: 'support', url: 'http://localhost:8000' },
        { name: 'technical', url: 'http://localhost:8001' },
        { name: 'creative', url: 'http://localhost:8002' },
      ]}
    >
      <div>
        <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
          <option value="support">Support</option>
          <option value="technical">Technical</option>
          <option value="creative">Creative</option>
        </select>
        
        <CopilotChat
          agentName={selectedAgent}
          labels={{
            title: `${selectedAgent} Assistant`,
            initial: `Hello! I'm your ${selectedAgent} assistant.`,
          }}
        />
      </div>
    </CopilotKit>
  );
}
```

### Custom Hook Usage

```tsx
import { useCopilotChat } from '@copilotkit/react-core';

function CustomChat() {
  const { sendMessage, messages, isLoading } = useCopilotChat({
    agentName: 'support',
  });

  const handleSend = async (content: string) => {
    await sendMessage({
      id: 'user-1',
      role: 'user',
      content,
    });
  };

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
      
      <input 
        placeholder="Type a message..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSend(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Agent not found error**:
   - Ensure the agent name matches exactly
   - Check that the ag_ui server is running and accessible
   - Verify the URL is correct

2. **Authentication errors**:
   - Check that headers are properly configured
   - Verify API keys are valid
   - Ensure credentials are set correctly

3. **Network errors**:
   - Check that the ag_ui server is running
   - Verify the URL is accessible from your application
   - Check CORS configuration if needed

### Debug Mode

Enable debug mode to see detailed error information:

```tsx
<CopilotKit
  aguiAgents={[...]}
  showDevConsole={true} // Enable debug mode
>
```

## Performance Considerations

- **Connection Pooling**: The integration efficiently manages connections to multiple ag_ui servers
- **Message Streaming**: Supports streaming responses for real-time updates
- **Error Recovery**: Automatic retry and recovery mechanisms
- **Memory Management**: Proper cleanup of resources and connections

## Security

- **Authentication**: Support for various authentication methods
- **Headers**: Secure transmission of custom headers
- **Credentials**: Proper handling of cookies and credentials
- **Error Handling**: No sensitive information leaked in error messages

