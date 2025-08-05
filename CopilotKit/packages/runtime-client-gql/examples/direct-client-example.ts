/**
 * Example: Using CopilotRuntimeDirectClient with AG_UI Server
 * 
 * This example demonstrates how to use the direct AG_UI client
 * in place of the GraphQL client for improved performance.
 */

import { CopilotRuntimeDirectClient } from "@copilotkit/runtime-client-gql";
import { TextMessage, ActionExecutionMessage, Role } from "@copilotkit/runtime-client-gql";

// Configuration for your AG_UI server
const AG_UI_SERVER_URL = process.env.AG_UI_SERVER_URL || "http://localhost:8000";

async function main() {
  // Create the direct client
  const client = new CopilotRuntimeDirectClient({
    url: AG_UI_SERVER_URL,
    headers: {
      "Content-Type": "application/json",
      // Add any authentication headers here
    },
    handleErrors: (error) => {
      console.error("❌ AG_UI Client Error:", error.message);
    },
    handleWarning: (warning) => {
      console.warn("⚠️  AG_UI Client Warning:", warning);
    }
  });

  console.log("🚀 Direct AG_UI Client initialized");

  // Example 1: Simple text conversation
  await simpleConversation(client);
  
  // Example 2: Action execution
  await actionExecution(client);
  
  // Example 3: Streaming response handling
  await streamingExample(client);
}

async function simpleConversation(client: CopilotRuntimeDirectClient) {
  console.log("\n📝 Example 1: Simple Conversation");
  
  const messages = [
    new TextMessage({
      role: Role.User,
      content: "Hello! Can you help me write a simple Python function?"
    })
  ];

  const response = client.generateCopilotResponse({
    data: {
      messages,
      metadata: { 
        sessionId: "example-session-1",
        timestamp: new Date().toISOString()
      }
    },
    properties: {
      temperature: 0.7,
      maxTokens: 500
    }
  });

  console.log("📤 Sent message to AG_UI agent");
  
  return new Promise((resolve, reject) => {
    let fullResponse = "";
    
    response.subscribe({
      next: ({ data }) => {
        if (data.__typename === "TextMessageOutput" && data.content) {
          fullResponse += data.content;
          process.stdout.write(data.content); // Stream output to console
        }
      },
      error: (error) => {
        console.error("\n❌ Conversation error:", error);
        reject(error);
      },
      complete: () => {
        console.log("\n✅ Conversation complete");
        console.log("📄 Full response:", fullResponse.slice(0, 100) + "...");
        resolve(fullResponse);
      }
    });
  });
}

async function actionExecution(client: CopilotRuntimeDirectClient) {
  console.log("\n🔧 Example 2: Action Execution");
  
  // Define available actions
  const actions = [
    {
      name: "calculate",
      description: "Perform mathematical calculations",
      jsonSchema: JSON.stringify({
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to evaluate"
          }
        },
        required: ["expression"]
      })
    },
    {
      name: "search_web",
      description: "Search the web for information",
      jsonSchema: JSON.stringify({
        type: "object", 
        properties: {
          query: {
            type: "string",
            description: "The search query"
          }
        },
        required: ["query"]
      })
    }
  ];

  const messages = [
    new TextMessage({
      role: Role.User,
      content: "Can you calculate 15 * 32 + 7 for me?"
    })
  ];

  const response = client.generateCopilotResponse({
    data: {
      messages,
      actions,
      metadata: { sessionId: "example-session-2" }
    }
  });

  console.log("📤 Sent action request to AG_UI agent");

  return new Promise((resolve, reject) => {
    const executedActions: any[] = [];
    
    response.subscribe({
      next: ({ data }) => {
        if (data.__typename === "ActionExecutionMessageOutput") {
          console.log(`🔧 Action: ${data.name}`);
          console.log(`📋 Arguments: ${JSON.stringify(data.arguments)}`);
          executedActions.push(data);
        } else if (data.__typename === "TextMessageOutput" && data.content) {
          process.stdout.write(data.content);
        }
      },
      error: (error) => {
        console.error("\n❌ Action execution error:", error);
        reject(error);
      },
      complete: () => {
        console.log("\n✅ Action execution complete");
        console.log(`🎯 Total actions executed: ${executedActions.length}`);
        resolve(executedActions);
      }
    });
  });
}

async function streamingExample(client: CopilotRuntimeDirectClient) {
  console.log("\n🌊 Example 3: Streaming Response");
  
  const messages = [
    new TextMessage({
      role: Role.User,
      content: "Write a detailed explanation of how neural networks work, including the key components and training process."
    })
  ];

  const response = client.generateCopilotResponse({
    data: {
      messages,
      metadata: { sessionId: "example-session-3" }
    },
    properties: {
      temperature: 0.8,
      maxTokens: 1000
    }
  });

  console.log("📤 Requesting detailed explanation from AG_UI agent");

  return new Promise((resolve, reject) => {
    let wordCount = 0;
    let startTime = Date.now();
    
    response.subscribe({
      next: ({ data }) => {
        if (data.__typename === "TextMessageOutput" && data.content) {
          // Count words in the stream
          const words = data.content.trim().split(/\s+/).length;
          wordCount += words;
          
          // Show streaming progress
          if (wordCount % 10 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(`\n📊 Progress: ${wordCount} words in ${elapsed.toFixed(1)}s`);
          }
        }
      },
      error: (error) => {
        console.error("\n❌ Streaming error:", error);
        reject(error);
      },
      complete: () => {
        const totalTime = (Date.now() - startTime) / 1000;
        console.log("\n✅ Streaming complete");
        console.log(`📈 Final stats: ${wordCount} words in ${totalTime.toFixed(1)}s`);
        console.log(`⚡ Rate: ${(wordCount / totalTime).toFixed(1)} words/second`);
        resolve({ wordCount, totalTime });
      }
    });
  });
}

async function demonstrateCompatibility() {
  console.log("\n🔄 Compatibility Demonstration");
  
  // Show that both clients have the same interface
  const directClient = new CopilotRuntimeDirectClient({
    url: AG_UI_SERVER_URL
  });

  // These methods exist on both clients
  console.log("✅ availableAgents method:", typeof directClient.availableAgents);
  console.log("✅ loadAgentState method:", typeof directClient.loadAgentState);
  console.log("✅ generateCopilotResponse method:", typeof directClient.generateCopilotResponse);
  console.log("✅ asStream method:", typeof directClient.asStream);
  
  // Test available agents
  const agentsResult = await directClient.availableAgents().toPromise();
  console.log("🤖 Available agents:", agentsResult.data.availableAgents.length);
}

// Run the examples
if (require.main === module) {
  main()
    .then(() => demonstrateCompatibility())
    .then(() => {
      console.log("\n🎉 All examples completed successfully!");
      console.log("💡 The direct AG_UI client is ready for production use.");
    })
    .catch((error) => {
      console.error("\n💥 Example failed:", error);
      process.exit(1);
    });
}

export {
  simpleConversation,
  actionExecution,
  streamingExample,
  demonstrateCompatibility
};