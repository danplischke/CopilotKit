/**
 * Example demonstrating multiple ag_ui endpoints support in CopilotKit
 * 
 * This example shows how to configure CopilotKit to connect to multiple ag_ui servers,
 * each potentially hosting different agents.
 */

import React from "react";
import { CopilotKit } from "@copilotkit/react-core";

// Example 1: Multiple ag_ui endpoints with specific agent mapping
export function MultipleAgentsExample() {
  const aguiEndpoints = {
    // Agent1 runs on port 8000
    "agent1": "http://localhost:8000",
    
    // Agent2 runs on port 8001  
    "agent2": "http://localhost:8001",
    
    // CustomerSupportAgent runs on port 8002
    "customer-support": "http://localhost:8002",
    
    // Default endpoint for any unspecified agents
    "default": "http://localhost:8003"
  };

  return (
    <CopilotKit aguiEndpoints={aguiEndpoints}>
      <YourApp />
    </CopilotKit>
  );
}

// Example 2: Backward compatibility - single endpoint
export function SingleAgentExample() {
  return (
    <CopilotKit aguiUrl="http://localhost:8000">
      <YourApp />
    </CopilotKit>
  );
}

// Example 3: Working with specific agents
function YourApp() {
  return (
    <div>
      <h1>CopilotKit Multi-Agent Demo</h1>
      <p>
        This app is configured to work with multiple ag_ui endpoints.
        Each agent will connect to its designated server:
      </p>
      <ul>
        <li>agent1 → http://localhost:8000</li>
        <li>agent2 → http://localhost:8001</li>
        <li>customer-support → http://localhost:8002</li>
        <li>other agents → http://localhost:8003 (default)</li>
      </ul>
      
      {/* When using useCoagent with a specific agent name, 
          CopilotKit will automatically route to the correct endpoint */}
      <AgentDemo />
    </div>
  );
}

function AgentDemo() {
  // This would automatically connect to http://localhost:8000
  // const agent1 = useCoagent({ name: "agent1" });
  
  // This would automatically connect to http://localhost:8001  
  // const agent2 = useCoagent({ name: "agent2" });
  
  // This would connect to the default endpoint http://localhost:8003
  // const unknownAgent = useCoagent({ name: "some-other-agent" });

  return (
    <div>
      <p>Use useCoagent hooks here to interact with specific agents.</p>
    </div>
  );
}

// Error handling example
export function ErrorHandlingExample() {
  const aguiEndpoints = {
    "agent1": "http://localhost:8000",
    "agent2": "http://localhost:8001"
  };

  // This will throw an error - cannot use both aguiUrl and aguiEndpoints
  /*
  return (
    <CopilotKit 
      aguiUrl="http://localhost:8000"
      aguiEndpoints={aguiEndpoints}  // ❌ Error: Cannot specify multiple connection methods
    >
      <YourApp />
    </CopilotKit>
  );
  */

  // This will also throw an error - empty endpoints
  /*
  return (
    <CopilotKit aguiEndpoints={{}}>  // ❌ Error: aguiEndpoints cannot be empty
      <YourApp />
    </CopilotKit>
  );
  */

  // Correct usage
  return (
    <CopilotKit aguiEndpoints={aguiEndpoints}>
      <YourApp />
    </CopilotKit>
  );
}

export default MultipleAgentsExample;