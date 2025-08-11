# CopilotKit ag_ui Integration Example

This is a comprehensive example demonstrating how to use CopilotKit with ag_ui servers directly, bypassing the traditional GraphQL proxy layer.

## 🚀 Features

- **Direct ag_ui Communication**: Connect directly to ag_ui servers without GraphQL proxy
- **Multi-Agent Support**: Configure and switch between multiple ag_ui agents
- **Dynamic Agent Management**: Add/remove agents at runtime
- **Custom Chat Interface**: Build custom chat UIs using CopilotKit hooks
- **Advanced Features**: Observability hooks, error handling, and more
- **Type Safety**: Full TypeScript support throughout
- **Dark Mode**: Built-in theme support
- **Responsive Design**: Works on desktop and mobile

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- ag_ui servers running on localhost:8000, 8001, 8002 (or configure your own)

## 🛠️ Installation

1. **Clone the repository and navigate to the example:**
   ```bash
   cd examples/next-agui
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm example-dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Examples Included

### 1. Basic Integration
Simple example showing how to connect to ag_ui servers with a dropdown to select different agents.

### 2. Multi-Agent Chat
Advanced interface with a sidebar showing all available agents and the ability to switch between them seamlessly.

### 3. Custom Chat Interface
Demonstrates how to build a custom chat interface using CopilotKit hooks instead of the pre-built components.

### 4. Agent Manager
Full-featured agent management system with forms to add/remove agents dynamically.

### 5. Advanced Features
Shows advanced features like observability hooks, error handling, and custom styling.

## 🔧 Configuration

### Basic Setup

```tsx
import { CopilotKit } from "@copilotkit/react-core";

function App() {
  return (
    <CopilotKit
      aguiAgents={[
        {
          name: "support",
          url: "http://localhost:8000",
          description: "Customer support agent",
        },
        {
          name: "technical",
          url: "http://localhost:8001", 
          description: "Technical assistant",
        },
      ]}
      showDevConsole={true}
    >
      {/* Your app components */}
    </CopilotKit>
  );
}
```

### With Authentication

```tsx
<CopilotKit
  aguiAgents={[
    {
      name: "secure-agent",
      url: "https://secure-server.example.com",
      description: "Secure agent with authentication",
      headers: {
        "Authorization": "Bearer your-api-key",
        "X-Custom-Header": "custom-value",
      },
      credentials: "include", // For cookies
    },
  ]}
>
```

### Using with Chat Components

```tsx
import { CopilotChat } from "@copilotkit/react-ui";

<CopilotChat
  agentName="support"
  labels={{
    title: "Support Assistant",
    initial: "Hello! How can I help you today?",
  }}
/>
```

### Using with Hooks

```tsx
import { useCopilotChat } from "@copilotkit/react-core";

function CustomChat() {
  const { sendMessage, messages, isLoading } = useCopilotChat({
    agentName: "support",
  });

  const handleSend = async (content: string) => {
    await sendMessage({
      id: "user-1",
      role: "user", 
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

### Using ag_ui Runtime Client Directly

```tsx
import { useAguiRuntimeClient } from '@copilotkit/react-core';

function CustomAguiChat() {
  const aguiClient = useAguiRuntimeClient({
    agents: [
      { name: 'support', url: 'http://localhost:8000' }
    ],
  });

  const handleSend = async (content: string) => {
    const response = await aguiClient.generateCopilotResponse({
      messages: [{ role: 'user', content }],
      agentName: 'support',
    });
    // Handle response...
  };

  return (
    <div>
      {/* Your custom ag_ui chat UI */}
    </div>
  );
}
```

## 🏗️ Project Structure

```
examples/next-agui/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles with Tailwind
│   │   ├── layout.tsx           # Root layout with theme provider
│   │   └── page.tsx             # Main page with all examples
│   └── components/
│       ├── Header.tsx           # App header with theme toggle
│       ├── Sidebar.tsx          # Navigation sidebar
│       ├── ThemeToggle.tsx      # Dark/light mode toggle
│       ├── ChatInterface.tsx    # Custom chat implementation
│       └── AgentManager.tsx     # Agent management interface
├── package.json                 # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
└── README.md                   # This file
```

## 🔍 Key Features Explained

### Direct ag_ui Communication

The example demonstrates how CopilotKit can communicate directly with ag_ui servers:

```tsx
// Traditional approach (with GraphQL proxy)
<CopilotKit runtimeUrl="http://localhost:3000/api/copilotkit">

// New approach (direct ag_ui)
<CopilotKit aguiAgents={[
  { name: "agent1", url: "http://localhost:8000" }
]}>
```

### Multi-Agent Support

Switch between different agents seamlessly:

```tsx
const [selectedAgent, setSelectedAgent] = useState("support");

<CopilotChat agentName={selectedAgent} />
```

### Dynamic Agent Management

Add and remove agents at runtime:

```tsx
const [agents, setAgents] = useState([...]);

const addAgent = (agent) => {
  setAgents([...agents, agent]);
};

const removeAgent = (name) => {
  setAgents(agents.filter(a => a.name !== name));
};
```

### Custom Chat Interface

Build your own chat UI using CopilotKit hooks:

```tsx
const { sendMessage, messages, isLoading } = useCopilotChat({
  agentName: "support",
});

// Custom UI implementation
return (
  <div>
    {messages.map(msg => (
      <div key={msg.id}>{msg.content}</div>
    ))}
    <input onKeyPress={handleSend} />
  </div>
);
```

## 🎨 Styling

The example uses Tailwind CSS with a custom design system:

- **Dark Mode**: Automatic theme switching
- **Responsive**: Mobile-first design
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Customizable**: Easy to modify colors and styling

## 🚨 Error Handling

The example includes comprehensive error handling:

- Network errors
- Authentication failures
- Agent not found errors
- Server errors

Errors are automatically displayed in the UI and logged to the console.

## 🔧 Development

### Available Scripts

- `pnpm example-dev` - Start development server
- `pnpm example-build` - Build for production
- `pnpm example-start` - Start production server
- `pnpm lint` - Run ESLint

### Environment Variables

No environment variables are required for this example, but you can add them for production:

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_AGENTS='[{"name":"support","url":"http://localhost:8000"}]'
```

## 🧪 Testing

To test the example:

1. Start your ag_ui servers on the configured ports
2. Run the development server
3. Navigate through different examples
4. Test agent switching and dynamic management
5. Try the custom chat interface

## 📚 Learn More

- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [ag_ui Protocol](https://github.com/ag-ui/ag-ui)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

This example is part of the CopilotKit project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This example is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
