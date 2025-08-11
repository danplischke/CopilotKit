"use client";

import { useCopilotChat } from "@copilotkit/react-core";
import { useState } from "react";

interface ChatInterfaceProps {
  agents: any[];
}

export function ChatInterface({ agents }: ChatInterfaceProps) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.name || "support");
  const [message, setMessage] = useState("");

  const { sendMessage, messages, isLoading, stopGeneration } = useCopilotChat({
    agentName: selectedAgent,
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await sendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Agent Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label htmlFor="custom-agent-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Agent
        </label>
        <select
          id="custom-agent-select"
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {agents.map((agent) => (
            <option key={agent.name} value={agent.name}>
              {agent.name} - {agent.description}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-lg font-medium mb-2">Start a conversation</div>
            <div className="text-sm">Send a message to begin chatting with {selectedAgent}</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {msg.role === "user" ? "You" : selectedAgent}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="text-sm font-medium mb-1">{selectedAgent}</div>
              <div className="text-sm">Thinking...</div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${selectedAgent}...`}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={2}
          />
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Send
            </button>
            {isLoading && (
              <button
                onClick={stopGeneration}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

