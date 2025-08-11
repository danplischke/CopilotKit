#!/usr/bin/env node

/**
 * Simple mock ag_ui server for testing the CopilotKit ag_ui integration example
 * 
 * This script creates a basic HTTP server that responds to ag_ui protocol requests
 * and can be used to test the example without setting up a full ag_ui server.
 * 
 * Usage:
 *   node mock-agui-server.js [port] [agent-name]
 * 
 * Examples:
 *   node mock-agui-server.js 8000 support
 *   node mock-agui-server.js 8001 technical
 *   node mock-agui-server.js 8002 creative
 */

const http = require('http');
const url = require('url');

const port = process.argv[2] || 8000;
const agentName = process.argv[3] || 'default';

// Mock agent responses
const agentResponses = {
  support: {
    description: "I'm a customer support agent. I can help you with account issues, billing questions, and general customer service inquiries.",
    responses: [
      "I understand your concern. Let me help you with that.",
      "Thank you for contacting support. I'll assist you right away.",
      "I can see the issue you're describing. Here's how we can resolve it:",
      "For your account security, I'll need to verify some information first.",
      "I've documented your request and will escalate it to our specialist team."
    ]
  },
  technical: {
    description: "I'm a technical assistant. I can help you with code problems, debugging, system architecture, and technical implementation questions.",
    responses: [
      "Looking at your code, I can see the issue. Here's the solution:",
      "For this technical problem, I recommend the following approach:",
      "Let me break down the architecture for you:",
      "The error you're seeing is caused by...",
      "Here's a more efficient way to implement this feature:"
    ]
  },
  creative: {
    description: "I'm a creative writing assistant. I can help you with storytelling, content creation, brainstorming, and creative projects.",
    responses: [
      "That's a fascinating idea! Let me help you develop it further:",
      "Here's a creative approach to your story:",
      "I love the concept you're working with. Consider this angle:",
      "For this creative project, I suggest the following structure:",
      "Let's explore some creative possibilities together:"
    ]
  },
  default: {
    description: "I'm a general assistant. I can help you with various tasks and questions.",
    responses: [
      "I'd be happy to help you with that.",
      "That's an interesting question. Let me think about it.",
      "I can assist you with this. Here's what I suggest:",
      "Let me provide you with some information on that topic:",
      "I understand what you're looking for. Here's my recommendation:"
    ]
  }
};

const agent = agentResponses[agentName] || agentResponses.default;

// Generate a random response
function getRandomResponse() {
  const responses = agent.responses;
  return responses[Math.floor(Math.random() * responses.length)];
}

// Parse JSON safely
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle different endpoints
  if (path === '/agents' && req.method === 'GET') {
    // Return available agents
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      {
        name: agentName,
        id: agentName,
        description: agent.description
      }
    ]));
    return;
  }

  if (path === `/agents/${agentName}/state` && req.method === 'GET') {
    // Return agent state
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      state: JSON.stringify({ status: 'ready' }),
      messages: JSON.stringify([])
    }));
    return;
  }

  if (path === '/run' && req.method === 'POST') {
    // Handle chat requests
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const data = parseJSON(body);
      
      if (!data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      // Simulate processing delay
      setTimeout(() => {
        const userMessage = data.messages?.find(m => m.role === 'user');
        const response = userMessage ? getRandomResponse() : "Hello! How can I help you today?";

        // Send streaming response
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked'
        });

        // Simulate streaming response
        const responseChunks = response.split(' ');
        let chunkIndex = 0;

        const sendChunk = () => {
          if (chunkIndex < responseChunks.length) {
            const chunk = responseChunks[chunkIndex] + ' ';
            res.write(chunk);
            chunkIndex++;
            setTimeout(sendChunk, 100); // 100ms delay between chunks
          } else {
            res.end();
          }
        };

        sendChunk();
      }, 500); // 500ms initial delay
    });
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`🚀 Mock ag_ui server running on http://localhost:${port}`);
  console.log(`🤖 Agent: ${agentName}`);
  console.log(`📝 Description: ${agent.description}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /agents - List available agents`);
  console.log(`   GET  /agents/${agentName}/state - Get agent state`);
  console.log(`   POST /run - Send chat messages`);
  console.log(`\n🛑 Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down mock ag_ui server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Try a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

