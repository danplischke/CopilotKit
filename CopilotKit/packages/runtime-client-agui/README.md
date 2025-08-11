# @copilotkit/runtime-client-agui

A direct runtime client for CopilotKit that connects to ag_ui servers without requiring a GraphQL proxy layer.

## Overview

This package provides a direct connection to ag_ui servers, bypassing the traditional CopilotKit architecture that uses a GraphQL proxy. It allows you to define multiple agents by name and their corresponding ag_ui server URLs.

## Architecture

Traditional CopilotKit flow:
```
Frontend → GraphQL Proxy → ag_ui Server
```

With this package:
```
Frontend → ag_ui Server (direct)
```

## Installation

```bash
npm install @copilotkit/runtime-client-agui
```

## Usage

### Basic Setup

```tsx
import { useAguiRuntimeClient } from '@copilotkit/runtime-client-agui';
import { useCopilotChat } from '@copilotkit/react-core';

function MyChatComponent() {
  const runtimeClient = useAguiRuntimeClient({
    agents: [
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
    ],
  });

  const { sendMessage, messages } = useCopilotChat({
    runtimeClient,
    agentName: 'support', // Specify which agent to use
  });

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Advanced Configuration

```tsx
import { useAguiRuntimeClient } from '@copilotkit/runtime-client-agui';

function MyAdvancedChatComponent() {
  const runtimeClient = useAguiRuntimeClient({
    agents: [
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
    ],
    publicApiKey: 'your-public-api-key', // Optional
    handleErrors: (error) => {
      console.error('AguiRuntimeClient error:', error);
    },
    handleWarning: (warning) => {
      console.warn('AguiRuntimeClient warning:', warning);
    },
  });

  // Use the runtime client with CopilotKit hooks
  const { sendMessage, messages } = useCopilotChat({
    runtimeClient,
    agentName: 'secure-agent',
  });

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Dynamic Agent Management

```tsx
import { useAguiRuntimeClient } from '@copilotkit/runtime-client-agui';

function DynamicAgentComponent() {
  const runtimeClient = useAguiRuntimeClient({
    agents: [
      {
        name: 'default',
        url: 'http://localhost:8000',
      },
    ],
  });

  // Add agents dynamically
  const addAgent = () => {
    runtimeClient.addAgent({
      name: 'new-agent',
      url: 'http://localhost:8002',
      description: 'Dynamically added agent',
    });
  };

  // Remove agents
  const removeAgent = () => {
    runtimeClient.removeAgent('new-agent');
  };

  // Get available agent names
  const agentNames = runtimeClient.getAgentNames();

  return (
    <div>
      <button onClick={addAgent}>Add Agent</button>
      <button onClick={removeAgent}>Remove Agent</button>
      <p>Available agents: {agentNames.join(', ')}</p>
    </div>
  );
}
```

### Using with CopilotKit Provider

```tsx
import { CopilotKit } from '@copilotkit/react-core';
import { useAguiRuntimeClient } from '@copilotkit/runtime-client-agui';

function App() {
  const runtimeClient = useAguiRuntimeClient({
    agents: [
      {
        name: 'main',
        url: 'http://localhost:8000',
      },
    ],
  });

  return (
    <CopilotKit
      runtimeClient={runtimeClient}
      publicApiKey="your-public-api-key"
    >
      <MyChatComponent />
    </CopilotKit>
  );
}
```

## API Reference

### AguiAgentConfig

```typescript
interface AguiAgentConfig {
  name: string;                    // Unique agent name
  url: string;                     // ag_ui server URL
  description?: string;            // Optional description
  headers?: Record<string, string>; // Optional headers
  credentials?: RequestCredentials; // Optional credentials
}
```

### AguiRuntimeClientOptions

```typescript
interface AguiRuntimeClientOptions {
  agents: AguiAgentConfig[];       // Array of agent configurations
  publicApiKey?: string;           // Optional public API key
  handleErrors?: (error: Error) => void;    // Error handler
  handleWarning?: (warning: string) => void; // Warning handler
}
```

### AguiRuntimeClient Methods

- `generateCopilotResponse(data, signal)`: Generate a response from an agent
- `availableAgents()`: Get available agents from all servers
- `loadAgentState(data)`: Load agent state from server
- `addAgent(config)`: Add a new agent configuration
- `removeAgent(name)`: Remove an agent configuration
- `getAgentNames()`: Get all configured agent names

## Message Conversion

The package includes utilities for converting between CopilotKit and ag_ui message formats:

```tsx
import { convertMessagesToAgui, convertMessagesFromAgui } from '@copilotkit/runtime-client-agui';

// Convert CopilotKit messages to ag_ui format
const aguiMessages = convertMessagesToAgui(copilotKitMessages);

// Convert ag_ui messages to CopilotKit format
const copilotKitMessages = convertMessagesFromAgui(aguiMessages);
```

## Error Handling

The client handles various error scenarios:

- Network errors
- Authentication errors
- Agent not found errors
- Server errors

Errors are automatically converted to CopilotKit error types and can be handled through the error handler or displayed in the UI.

## Requirements

- Node.js 18+
- React 18+
- ag_ui server running and accessible
- @copilotkit/react-core for React integration

## License

MIT

