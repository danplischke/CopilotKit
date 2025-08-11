"use client";

import { useState } from "react";

interface AgentManagerProps {
  agents: any[];
  onAddAgent: (agent: any) => void;
  onRemoveAgent: (name: string) => void;
}

export function AgentManager({ agents, onAddAgent, onRemoveAgent }: AgentManagerProps) {
  const [newAgent, setNewAgent] = useState({
    name: "",
    url: "",
    description: "",
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAgent.name || !newAgent.url) {
      alert("Name and URL are required");
      return;
    }

    // Check if agent name already exists
    if (agents.some(agent => agent.name === newAgent.name)) {
      alert("Agent name already exists");
      return;
    }

    onAddAgent({
      name: newAgent.name,
      url: newAgent.url,
      description: newAgent.description || `${newAgent.name} agent`,
    });

    setNewAgent({ name: "", url: "", description: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Agent Manager
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your ag_ui agents dynamically.
        </p>
      </div>

      {/* Add Agent Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Add New Agent
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              {showForm ? "Cancel" : "Add Agent"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Name *
                </label>
                <input
                  type="text"
                  id="agent-name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., support, technical, creative"
                  required
                />
              </div>

              <div>
                <label htmlFor="agent-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server URL *
                </label>
                <input
                  type="url"
                  id="agent-url"
                  value={newAgent.url}
                  onChange={(e) => setNewAgent({ ...newAgent, url: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., http://localhost:8000"
                  required
                />
              </div>

              <div>
                <label htmlFor="agent-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  id="agent-description"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Customer support agent"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Add Agent
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Current Agents ({agents.length})
          </h2>

          {agents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No agents configured. Add your first agent above.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {agent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {agent.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {agent.url}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                    <button
                      onClick={() => onRemoveAgent(agent.name)}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove agent"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                const newAgent = {
                  name: `agent-${Date.now()}`,
                  url: `http://localhost:${8000 + agents.length}`,
                  description: `Dynamic agent ${agents.length + 1}`,
                };
                onAddAgent(newAgent);
              }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Add Test Agent
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Quickly add a test agent with auto-generated name
              </div>
            </button>

            <button
              onClick={() => {
                const defaultAgents = [
                  { name: "support", url: "http://localhost:8000", description: "Customer support agent" },
                  { name: "technical", url: "http://localhost:8001", description: "Technical assistant" },
                  { name: "creative", url: "http://localhost:8002", description: "Creative writing assistant" },
                ];
                
                defaultAgents.forEach(agent => {
                  if (!agents.some(existing => existing.name === agent.name)) {
                    onAddAgent(agent);
                  }
                });
              }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Add Default Agents
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Add support, technical, and creative agents
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

