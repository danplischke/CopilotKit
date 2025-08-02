# CopilotKit AgUI Server Integration

This update enables CopilotKit React components to directly consume an ag_ui server instead of requiring a Runtime Server.

## Overview

Previously, CopilotKit required a Runtime Server as an intermediary between the React components and AI services. With this update, you can now connect directly to an ag_ui server, simplifying your architecture and reducing latency.

## Usage

### Basic Setup

```tsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function App() {
  return (
    <CopilotKit
      aguiServerUrl="http://localhost:8080/api/agui"
      // Optional: still support runtime server as fallback
      runtimeUrl="/api/copilotkit"
    >
      <CopilotSidebar
        instructions="You are connected to an ag_ui server."
        defaultOpen={true}
        labels={{
          title: "AgUI Copilot",
          initial: "Hi! I'm powered by ag_ui server 🤖",
        }}
      >
        <div>
          <h1>AgUI Server Integration</h1>
          <p>This example shows CopilotKit connected directly to an ag_ui server.</p>
        </div>
      </CopilotSidebar>
    </CopilotKit>
  );
}
```

### Configuration Options

The `CopilotKit` component now accepts an `aguiServerUrl` prop:

```tsx
<CopilotKit
  aguiServerUrl="http://localhost:8080/api/agui"  // Direct ag_ui server connection
  publicApiKey="your-api-key"                     // Optional authentication
  headers={{                                      // Optional custom headers
    "Authorization": "Bearer token",
    "X-Custom-Header": "value"
  }}
>
  {/* Your app components */}
</CopilotKit>
```

## Migration Guide

### From Runtime Server to AgUI Server

**Before (Runtime Server):**
```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  {/* Your app */}
</CopilotKit>
```

**After (AgUI Server):**
```tsx
<CopilotKit aguiServerUrl="http://localhost:8080/api/agui">
  {/* Your app */}
</CopilotKit>
```

### Backward Compatibility

You can provide both `runtimeUrl` and `aguiServerUrl` for a gradual migration:

```tsx
<CopilotKit
  aguiServerUrl="http://localhost:8080/api/agui"  // Primary (ag_ui server)
  runtimeUrl="/api/copilotkit"                   // Fallback (runtime server)
>
  {/* Your app */}
</CopilotKit>
```

When both are provided, the component will prefer the ag_ui server but can fall back to the runtime server if needed.

## Implementation Details

### AgUI Client

The new `AgUiClient` class provides compatibility with the existing `CopilotRuntimeClient` interface while connecting directly to ag_ui servers. Key features:

- **Stream Compatibility**: Maintains the same streaming interface as the runtime client
- **Error Handling**: Consistent error handling and reporting
- **Message Conversion**: Automatic conversion between CopilotKit and ag_ui message formats
- **Authentication**: Support for API keys and custom headers

### Architecture Benefits

1. **Reduced Latency**: Direct connection eliminates the runtime server intermediary
2. **Simplified Deployment**: One less service to manage
3. **Better Performance**: Fewer network hops and reduced overhead
4. **Enhanced Compatibility**: Native ag_ui features accessible directly

## Dependencies

The integration adds the following ag_ui dependencies to `@copilotkit/react-core`:

- `@ag-ui/client`
- `@ag-ui/core`
- `@ag-ui/encoder`
- `@ag-ui/proto`

These are automatically installed when you update to the latest version.

## TypeScript Support

Full TypeScript support is included with proper type definitions for:

- `aguiServerUrl` prop
- AgUiClient configuration options
- Message format conversions
- Error handling

## Examples

See the `examples/agui-example.tsx` file for a complete working example of ag_ui server integration.

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure your ag_ui server is running and accessible at the specified URL
2. **Authentication**: Check that API keys are correctly configured
3. **CORS**: Verify CORS settings on your ag_ui server for browser-based applications

### Debug Mode

Enable debug mode to see detailed connection information:

```tsx
<CopilotKit
  aguiServerUrl="http://localhost:8080/api/agui"
  showDevConsole={true}  // Enable debug information
>
  {/* Your app */}
</CopilotKit>
```

## Future Enhancements

This initial implementation provides a foundation for ag_ui server integration. Future improvements may include:

- Enhanced streaming capabilities
- Advanced ag_ui feature support
- Performance optimizations
- Additional configuration options

## Support

For issues related to ag_ui server integration, please file an issue on the CopilotKit GitHub repository with the "ag_ui" label.