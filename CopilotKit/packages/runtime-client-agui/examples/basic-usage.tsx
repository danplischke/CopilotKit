import React, { useState } from 'react';
import { useAguiRuntimeClient } from '../src/hooks/useAguiRuntimeClient';
import { useCopilotChat } from '@copilotkit/react-core';

export function BasicUsageExample() {
  const [selectedAgent, setSelectedAgent] = useState('support');

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
      {
        name: 'creative',
        url: 'http://localhost:8002',
        description: 'Creative writing assistant',
      },
    ],
    handleErrors: (error) => {
      console.error('AguiRuntimeClient error:', error);
    },
  });

  const { sendMessage, messages, isLoading } = useCopilotChat({
    runtimeClient,
    agentName: selectedAgent,
  });

  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>AguiRuntimeClient Example</h1>
      
      {/* Agent Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="agent-select">Select Agent: </label>
        <select
          id="agent-select"
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="support">Support Agent</option>
          <option value="technical">Technical Assistant</option>
          <option value="creative">Creative Assistant</option>
        </select>
      </div>

      {/* Messages Display */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '300px',
          marginBottom: '20px',
          overflowY: 'auto',
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ fontStyle: 'italic', color: '#666' }}>
            Agent is thinking...
          </div>
        )}
      </div>

      {/* Input and Send */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>

      {/* Available Agents Info */}
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Available agents: {runtimeClient.getAgentNames().join(', ')}</p>
      </div>
    </div>
  );
}

