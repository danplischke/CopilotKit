import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function AgUiExample() {
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
          <h1>AgUI Server Integration Example</h1>
          <p>This example shows CopilotKit connected directly to an ag_ui server.</p>
        </div>
      </CopilotSidebar>
    </CopilotKit>
  );
}