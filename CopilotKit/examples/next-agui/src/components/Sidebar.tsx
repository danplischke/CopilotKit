interface SidebarProps {
  selectedExample: string;
  onExampleChange: (example: string) => void;
  agents: any[];
  onAddAgent: (agent: any) => void;
  onRemoveAgent: (name: string) => void;
}

export function Sidebar({ selectedExample, onExampleChange, agents, onAddAgent, onRemoveAgent }: SidebarProps) {
  const examples = [
    { id: "basic", name: "Basic Integration", description: "Simple ag_ui connection" },
    { id: "multi-agent", name: "Multi-Agent Chat", description: "Switch between agents" },
    { id: "custom-chat", name: "Custom Chat", description: "Using CopilotKit hooks" },
    { id: "agent-manager", name: "Agent Manager", description: "Dynamic agent management" },
    { id: "advanced", name: "Advanced Features", description: "Observability and hooks" },
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Examples
        </h2>
        
        <nav className="space-y-2">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => onExampleChange(example.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedExample === example.id
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {example.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {example.description}
              </div>
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Current Agents ({agents.length})
          </h3>
          
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {agent.url}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveAgent(agent.name)}
                  className="ml-2 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove agent"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const newAgent = {
                name: `agent-${Date.now()}`,
                url: `http://localhost:${8000 + agents.length}`,
                description: `Dynamic agent ${agents.length + 1}`,
              };
              onAddAgent(newAgent);
            }}
            className="mt-3 w-full px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            + Add Agent
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Quick Start
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>1. Start your ag_ui servers on ports 8000, 8001, 8002</p>
            <p>2. Select an example from above</p>
            <p>3. Start chatting with your agents!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

