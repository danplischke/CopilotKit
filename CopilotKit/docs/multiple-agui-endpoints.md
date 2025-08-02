# Multiple ag_ui Endpoints Support

CopilotKit now supports connecting to multiple ag_ui servers simultaneously, allowing you to work with different agents hosted on different endpoints.

## Basic Usage

### Single Endpoint (Backward Compatible)
```tsx
<CopilotKit aguiUrl="http://localhost:8000">
  <YourApp />
</CopilotKit>
```

### Multiple Endpoints
```tsx
<CopilotKit aguiEndpoints={{
  "agent1": "http://localhost:8000",
  "agent2": "http://localhost:8001",
  "customer-support": "http://localhost:8002",
  "default": "http://localhost:8003"
}}>
  <YourApp />
</CopilotKit>
```

## How It Works

1. **Agent Routing**: When you use `useCoagent({ name: "agent1" })`, CopilotKit automatically routes to `http://localhost:8000`
2. **Default Fallback**: Agents not explicitly mapped use the "default" endpoint
3. **Automatic Selection**: The framework handles client selection based on agent names

## Configuration Options

| Prop | Type | Description |
|------|------|-------------|
| `aguiUrl` | `string` | Single ag_ui endpoint (legacy) |
| `aguiEndpoints` | `Record<string, string>` | Multiple endpoints mapped by agent name |
| `runtimeUrl` | `string` | CopilotKit Runtime Server (mutually exclusive) |

## Validation Rules

- Cannot use `runtimeUrl` with `aguiUrl` or `aguiEndpoints`
- Cannot use both `aguiUrl` and `aguiEndpoints` together  
- `aguiEndpoints` cannot be empty object
- Cloud features require `runtimeUrl` (not compatible with direct ag_ui)

## Error Handling

The system provides clear error messages for invalid configurations:

```tsx
// ❌ Error: Cannot specify multiple connection methods
<CopilotKit 
  aguiUrl="http://localhost:8000"
  aguiEndpoints={{ "agent1": "http://localhost:8001" }}
>

// ❌ Error: aguiEndpoints cannot be empty  
<CopilotKit aguiEndpoints={{}}>

// ❌ Error: Cannot use cloud features with ag_ui
<CopilotKit 
  aguiEndpoints={{ "agent1": "http://localhost:8000" }}
  publicApiKey="your-key"
>
```

## Migration Guide

### From Single Endpoint
```tsx
// Before
<CopilotKit aguiUrl="http://localhost:8000">

// After (equivalent)
<CopilotKit aguiEndpoints={{ "default": "http://localhost:8000" }}>
```

### Adding Multiple Agents
```tsx
// Start with your main agent
<CopilotKit aguiEndpoints={{
  "default": "http://localhost:8000"  // Your existing agent
}}>

// Add more agents as needed
<CopilotKit aguiEndpoints={{
  "main-agent": "http://localhost:8000",
  "support-agent": "http://localhost:8001", 
  "analytics-agent": "http://localhost:8002",
  "default": "http://localhost:8000"  // Fallback
}}>
```

## Current Limitations

- `useChat` hook currently works only with runtime servers
- Full ag_ui support in `useChat` is planned for a future release
- Use `useCoagent` for direct ag_ui interactions

## Example Implementation

```tsx
import { useCoagent } from "@copilotkit/react-core";

function MyComponent() {
  // Connects to agent1's endpoint (http://localhost:8000)
  const agent1 = useCoagent({ 
    name: "agent1",
    initialState: { status: "ready" }
  });
  
  // Connects to agent2's endpoint (http://localhost:8001)
  const agent2 = useCoagent({ 
    name: "agent2", 
    initialState: { tasks: [] }
  });
  
  // Connects to default endpoint (http://localhost:8003)
  const helperAgent = useCoagent({ 
    name: "helper-agent",
    initialState: { mode: "assist" }
  });
  
  return <div>Multiple agents working together!</div>;
}
```