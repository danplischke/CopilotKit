# AG_UI Direct Access Client

This package now includes a `CopilotRuntimeDirectClient` that connects directly to AG_UI servers, bypassing the GraphQL layer for improved performance and reduced complexity.

## Usage

### Basic Setup

```typescript
import { CopilotRuntimeDirectClient } from "@copilotkit/runtime-client-gql";

// Create a direct client that connects to your AG_UI server
const client = new CopilotRuntimeDirectClient({
  url: "http://localhost:8000", // Your AG_UI server URL
  headers: {
    "Authorization": "Bearer your-token",
    "x-custom-header": "value"
  },
  handleErrors: (error) => {
    console.error("AG_UI Error:", error);
  },
  handleWarning: (warning) => {
    console.warn("AG_UI Warning:", warning);
  }
});
```

### Generating Responses

```typescript
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";

// Create messages
const messages = [
  new TextMessage({
    role: Role.User,
    content: "Hello, how can you help me?"
  })
];

// Generate response from AG_UI agent
const responseStream = client.generateCopilotResponse({
  data: {
    messages,
    actions: [], // Your available actions
    metadata: { userId: "123" }
  },
  properties: {
    temperature: 0.7,
    maxTokens: 1000
  }
});

// Handle streaming response
responseStream.subscribe({
  next: ({ data }) => {
    if (data.__typename === "TextMessageOutput") {
      console.log("Text content:", data.content);
    } else if (data.__typename === "ActionExecutionMessageOutput") {
      console.log("Action execution:", data.name, data.arguments);
    }
  },
  error: (error) => {
    console.error("Stream error:", error);
  },
  complete: () => {
    console.log("Response complete");
  }
});
```

### Available Methods

The `CopilotRuntimeDirectClient` implements the same interface as `CopilotRuntimeClient` for compatibility:

- `generateCopilotResponse()` - Generate responses from AG_UI agent
- `availableAgents()` - Get available agents (returns default AG_UI agent)
- `loadAgentState()` - Load agent state (placeholder implementation)
- `asStream()` - Convert observables to readable streams

### Migration from GraphQL Client

The direct client is a drop-in replacement for most use cases:

```typescript
// Before (GraphQL client)
import { CopilotRuntimeClient } from "@copilotkit/runtime-client-gql";

const graphqlClient = new CopilotRuntimeClient({
  url: "http://localhost:4000/graphql", // GraphQL endpoint
  // ... other options
});

// After (Direct AG_UI client)
import { CopilotRuntimeDirectClient } from "@copilotkit/runtime-client-gql";

const directClient = new CopilotRuntimeDirectClient({
  url: "http://localhost:8000", // Direct AG_UI server
  // ... other options
});
```

### Benefits

1. **Performance**: Eliminates GraphQL middleware overhead
2. **Simplicity**: Direct communication with AG_UI servers
3. **Compatibility**: Same interface as existing GraphQL client
4. **Real-time**: Native streaming support from AG_UI

### Error Handling

The direct client maintains the same error handling patterns:

```typescript
const client = new CopilotRuntimeDirectClient({
  url: "http://localhost:8000",
  handleErrors: (error) => {
    if (error.message.includes("connection refused")) {
      // Handle connection errors
    } else if (error.message.includes("timeout")) {
      // Handle timeout errors
    }
    // Other error handling...
  }
});
```

## Architecture

```
┌─────────────┐    Direct     ┌─────────────┐
│   Frontend  │──── HTTP ────▶│ AG_UI Server│
└─────────────┘               └─────────────┘
```

Instead of:

```
┌─────────────┐   GraphQL   ┌─────────┐   AG_UI   ┌─────────────┐
│   Frontend  │────────────▶│ Runtime │──────────▶│ AG_UI Server│
└─────────────┘             └─────────┘           └─────────────┘
```