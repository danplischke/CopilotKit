"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useState } from "react";
import { AgentManager } from "../components/AgentManager";
import { ChatInterface } from "../components/ChatInterface";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

export default function Home() {
  const [selectedExample, setSelectedExample] = useState("basic");
  const [agents, setAgents] = useState([
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
    {
      name: "creative",
      url: "http://localhost:8002",
      description: "Creative writing assistant",
    },
  ]);

  const addAgent = (agent: any) => {
    setAgents([...agents, agent]);
  };

  const removeAgent = (name: string) => {
    setAgents(agents.filter((agent) => agent.name !== name));
  };

  return (
    <CopilotKit
      aguiAgents={agents}
      showDevConsole={true}
      onError={(errorEvent) => {
        console.error("CopilotKit Error:", errorEvent);
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <div className="flex">
          <Sidebar 
            selectedExample={selectedExample} 
            onExampleChange={setSelectedExample}
            agents={agents}
            onAddAgent={addAgent}
            onRemoveAgent={removeAgent}
          />
          
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {selectedExample === "basic" && (
                <BasicExample agents={agents} />
              )}
              
              {selectedExample === "multi-agent" && (
                <MultiAgentExample agents={agents} />
              )}
              
              {selectedExample === "custom-chat" && (
                <CustomChatExample agents={agents} />
              )}
              
              {selectedExample === "agent-manager" && (
                <AgentManager 
                  agents={agents}
                  onAddAgent={addAgent}
                  onRemoveAgent={removeAgent}
                />
              )}
              
              {selectedExample === "advanced" && (
                <AdvancedExample agents={agents} />
              )}
            </div>
          </main>
        </div>
      </div>
    </CopilotKit>
  );
}

function BasicExample({ agents }: { agents: any[] }) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.name || "support");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Basic ag_ui Integration
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Simple example of connecting to ag_ui servers with CopilotKit.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Agent
          </label>
          <select
            id="agent-select"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {agents.map((agent) => (
              <option key={agent.name} value={agent.name}>
                {agent.name} - {agent.description}
              </option>
            ))}
          </select>
        </div>

        <div className="h-96">
          <CopilotChat
            agentName={selectedAgent}
            labels={{
              title: `${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Assistant`,
              initial: `Hi! I'm your ${selectedAgent} assistant. How can I help you today?`,
              placeholder: `Ask me anything about ${selectedAgent}...`,
            }}
            suggestions="auto"
          />
        </div>
      </div>
    </div>
  );
}

function MultiAgentExample({ agents }: { agents: any[] }) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.name || "support");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Multi-Agent Chat
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Switch between different ag_ui agents seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Available Agents
            </h3>
            <div className="space-y-3">
              {agents.map((agent) => (
                <button
                  key={agent.name}
                  onClick={() => setSelectedAgent(agent.name)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAgent === agent.name
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {agent.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {agent.description}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {agent.url}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96">
            <CopilotChat
              agentName={selectedAgent}
              labels={{
                title: `${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Assistant`,
                initial: `Hello! I'm your ${selectedAgent} assistant. How can I help you today?`,
                placeholder: `Ask me anything about ${selectedAgent}...`,
              }}
              suggestions="auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomChatExample({ agents }: { agents: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Custom Chat Interface
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Using CopilotKit hooks to build a custom chat interface.
        </p>
      </div>

      <ChatInterface agents={agents} />
    </div>
  );
}

function AdvancedExample({ agents }: { agents: any[] }) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.name || "support");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Advanced Features
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Demonstrating advanced features like observability hooks and custom styling.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="advanced-agent-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Agent
              </label>
              <select
                id="advanced-agent-select"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {agents.map((agent) => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name} - {agent.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Agent: {selectedAgent}
            </div>
          </div>
        </div>

        <div className="h-96">
          <CopilotChat
            agentName={selectedAgent}
            labels={{
              title: `${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Assistant`,
              initial: `Hi! I'm your ${selectedAgent} assistant with advanced features. How can I help you today?`,
              placeholder: `Ask me anything about ${selectedAgent}...`,
            }}
            suggestions="auto"
            observabilityHooks={{
              onMessageSent: (message) => {
                console.log(`Message sent to ${selectedAgent}:`, message);
              },
              onMessageReceived: (message) => {
                console.log(`Message received from ${selectedAgent}:`, message);
              },
            }}
            onThumbsUp={(message) => {
              console.log("Thumbs up for message:", message);
            }}
            onThumbsDown={(message) => {
              console.log("Thumbs down for message:", message);
            }}
            onCopy={(message) => {
              console.log("Message copied:", message);
            }}
          />
        </div>
      </div>
    </div>
  );
}

