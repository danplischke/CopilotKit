"""Pydantic AI agent for CopilotKit"""

import uuid
import json
from typing import Optional, List, Callable, Any, cast, Union, TypedDict, Literal
from typing_extensions import NotRequired

try:
    import pydantic_ai
    from pydantic_ai import Agent as PydanticAgent, RunContext
    from pydantic_ai.messages import ModelMessage as PydanticModelMessage
    from pydantic_ai.result import AgentRunResult as PydanticAgentRunResult
except ImportError as e:
    raise ImportError(
        "pydantic-ai is required for PydanticAIAgent. Install it with: pip install pydantic-ai"
    ) from e

from .types import Message, MetaEvent
from .utils import filter_by_schema_keys
from .action import ActionDict
from .agent import Agent
from .logging import get_logger

logger = get_logger(__name__)


class PydanticAIConfig(TypedDict):
    """
    CopilotKit config for PydanticAIAgent

    This is used for advanced cases where you want to customize how CopilotKit interacts with
    Pydantic AI.

    ```python
    # Function signatures:
    def merge_state(
        *,
        state: dict,
        messages: List[Any],
        actions: List[Any],
        agent_name: str
    ):
        # ...implementation...

    def convert_messages(messages: List[Message]):
        # ...implementation...
    ```

    Parameters
    ----------
    merge_state : Callable
        This function lets you customize how CopilotKit merges the agent state.
    convert_messages : Callable
        Use this function to customize how CopilotKit converts its messages to Pydantic AI messages.
    """
    merge_state: NotRequired[Callable]
    convert_messages: NotRequired[Callable]


def pydantic_ai_default_merge_state(
    *,
    state: dict,
    messages: List[Any],
    actions: List[Any],
    agent_name: str
):
    """Default merge state for Pydantic AI"""
    return {
        **state,
        "messages": messages,
        "copilotkit": {
            "actions": actions
        }
    }


def copilotkit_messages_to_pydantic_ai(messages: List[Message]) -> List[PydanticModelMessage]:
    """Convert CopilotKit messages to Pydantic AI message format"""
    from pydantic_ai.messages import (
        ModelRequest, ModelResponse, UserPromptPart, TextPart, ToolCallPart, ToolReturnPart
    )
    
    pydantic_messages = []
    
    for message in messages:
        if message.get("role") == "user":
            # User message
            content = message.get("content", "")
            if isinstance(content, str):
                pydantic_messages.append(
                    ModelRequest([UserPromptPart(content=content)])
                )
        elif message.get("role") == "assistant":
            # Assistant message
            parts = []
            content = message.get("content")
            if content:
                parts.append(TextPart(content=content))
            
            # Handle tool calls if present
            tool_calls = message.get("tool_calls", [])
            for tool_call in tool_calls:
                parts.append(ToolCallPart(
                    tool_name=tool_call.get("function", {}).get("name", ""),
                    args=json.loads(tool_call.get("function", {}).get("arguments", "{}")),
                    tool_call_id=tool_call.get("id", "")
                ))
            
            if parts:
                pydantic_messages.append(ModelResponse(parts=parts))
        elif message.get("role") == "tool":
            # Tool response
            tool_name = message.get("name", "")
            content = message.get("content", "")
            tool_call_id = message.get("tool_call_id", "")
            
            pydantic_messages.append(
                ModelRequest([ToolReturnPart(
                    tool_name=tool_name,
                    content=content,
                    tool_call_id=tool_call_id
                )])
            )
    
    return pydantic_messages


def pydantic_ai_messages_to_copilotkit(messages: List[PydanticModelMessage]) -> List[Message]:
    """Convert Pydantic AI messages to CopilotKit message format"""
    from pydantic_ai.messages import (
        ModelRequest, ModelResponse, UserPromptPart, TextPart, ToolCallPart, ToolReturnPart
    )
    
    copilotkit_messages = []
    
    for message in messages:
        if isinstance(message, ModelRequest):
            for part in message.parts:
                if isinstance(part, UserPromptPart):
                    copilotkit_messages.append({
                        "role": "user",
                        "content": part.content
                    })
                elif isinstance(part, ToolReturnPart):
                    copilotkit_messages.append({
                        "role": "tool",
                        "name": part.tool_name,
                        "content": part.content,
                        "tool_call_id": part.tool_call_id
                    })
        elif isinstance(message, ModelResponse):
            content = ""
            tool_calls = []
            
            for part in message.parts:
                if isinstance(part, TextPart):
                    content += part.content
                elif isinstance(part, ToolCallPart):
                    tool_calls.append({
                        "id": part.tool_call_id,
                        "type": "function",
                        "function": {
                            "name": part.tool_name,
                            "arguments": json.dumps(part.args)
                        }
                    })
            
            msg = {"role": "assistant"}
            if content:
                msg["content"] = content
            if tool_calls:
                msg["tool_calls"] = tool_calls
            
            copilotkit_messages.append(msg)
    
    return copilotkit_messages


class PydanticAIAgent(Agent):
    """
    PydanticAIAgent lets you use Pydantic AI agents with CopilotKit.

    To install, run:

    ```bash
    pip install copilotkit pydantic-ai
    ```

    ### Examples

    Every agent must have the `name` and `pydantic_agent` properties defined. An optional `description`
    can also be provided. This is used when CopilotKit is dynamically routing requests to the
    agent.

    ```python
    from copilotkit import PydanticAIAgent
    from pydantic_ai import Agent

    pydantic_agent = Agent('openai:gpt-4o')
    
    copilotkit_agent = PydanticAIAgent(
        name="my_agent",
        description="This agent helps with tasks",
        pydantic_agent=pydantic_agent,
    )
    ```

    Parameters
    ----------
    name : str
        The name of the agent.
    pydantic_agent : pydantic_ai.Agent
        The Pydantic AI agent to use.
    description : Optional[str]
        The description of the agent.
    copilotkit_config : Optional[PydanticAIConfig]
        The CopilotKit config to use with the agent.
    """
    
    def __init__(
        self,
        *,
        name: str,
        pydantic_agent: PydanticAgent,
        description: Optional[str] = None,
        copilotkit_config: Optional[PydanticAIConfig] = None,
    ):
        super().__init__(
            name=name,
            description=description,
        )
        
        self.pydantic_agent = pydantic_agent
        self.thread_state = {}
        
        # Set up configuration
        self.merge_state = None
        if copilotkit_config is not None:
            self.merge_state = copilotkit_config.get("merge_state")
        if not self.merge_state:
            self.merge_state = pydantic_ai_default_merge_state
            
        self.convert_messages = (
            copilotkit_config.get("convert_messages")
            if copilotkit_config
            else None
        ) or copilotkit_messages_to_pydantic_ai

    def execute(
        self,
        *,
        state: dict,
        config: Optional[dict] = None,
        messages: List[Message],
        thread_id: str,
        actions: Optional[List[ActionDict]] = None,
        meta_events: Optional[List[MetaEvent]] = None,
        **kwargs
    ):
        """Execute the Pydantic AI agent"""
        return self._stream_events(
            state=state,
            config=config,
            messages=messages,
            actions=actions,
            thread_id=thread_id,
            meta_events=meta_events
        )

    async def _stream_events(
        self,
        *,
        state: Any,
        config: Optional[dict] = None,
        messages: List[Message],
        thread_id: str,
        actions: Optional[List[ActionDict]] = None,
        meta_events: Optional[List[MetaEvent]] = None,
    ):
        """Stream events from the Pydantic AI agent"""
        try:
            # Convert CopilotKit messages to Pydantic AI format
            pydantic_messages = self.convert_messages(messages)
            
            # Get the latest user message for the run
            user_prompt = None
            if messages:
                last_message = messages[-1]
                if last_message.get("role") == "user":
                    user_prompt = last_message.get("content", "")
            
            # Merge state with messages and actions
            merged_state = cast(Callable, self.merge_state)(
                state=state,
                messages=pydantic_messages,
                actions=actions or [],
                agent_name=self.name
            )
            
            # Store state for this thread
            self.thread_state[thread_id] = merged_state
            
            # Run the Pydantic AI agent
            if user_prompt:
                # Use run_stream for streaming support
                async with self.pydantic_agent.run_stream(
                    user_prompt,
                    message_history=pydantic_messages[:-1] if len(pydantic_messages) > 1 else None
                ) as stream_result:
                    # Stream the response
                    async for chunk in stream_result:
                        # Emit streaming events
                        yield self._emit_state_sync_event(
                            thread_id=thread_id,
                            run_id=str(uuid.uuid4()),
                            node_name="pydantic_ai_stream",
                            state=merged_state,
                            running=True,
                            active=True
                        ) + "\n"
                    
                    # Get final result
                    final_output = await stream_result.get_output()
                    
                    # Update state with final result
                    merged_state["last_output"] = final_output
                    self.thread_state[thread_id] = merged_state
                    
                    # Emit final state
                    yield self._emit_state_sync_event(
                        thread_id=thread_id,
                        run_id=str(uuid.uuid4()),
                        node_name="pydantic_ai_complete",
                        state=merged_state,
                        running=False,
                        active=False,
                        include_messages=True
                    ) + "\n"
            else:
                # No user prompt, just return current state
                yield self._emit_state_sync_event(
                    thread_id=thread_id,
                    run_id=str(uuid.uuid4()),
                    node_name="pydantic_ai_idle",
                    state=merged_state,
                    running=False,
                    active=False
                ) + "\n"
                
        except Exception as error:
            # Emit error information
            error_message = str(error)
            error_type = type(error).__name__
            
            error_details = {
                "message": error_message,
                "type": error_type,
                "agent_name": self.name,
            }
            
            # Emit error event
            yield json.dumps({
                "event": "on_copilotkit_error",
                "data": {
                    "error": error_details,
                    "thread_id": thread_id,
                    "agent_name": self.name,
                    "node_name": "pydantic_ai_error"
                }
            }) + "\n"
            
            # Re-raise the exception
            raise

    def _emit_state_sync_event(
        self,
        *,
        thread_id: str,
        run_id: str,
        node_name: str,
        state: dict,
        running: bool,
        active: bool,
        include_messages: bool = False
    ):
        """Emit a state sync event"""
        if not include_messages:
            state = {
                k: v for k, v in state.items() if k != "messages"
            }
        else:
            # Convert messages back to CopilotKit format
            pydantic_messages = state.get("messages", [])
            state = {
                **state,
                "messages": pydantic_ai_messages_to_copilotkit(pydantic_messages)
            }
        
        return json.dumps({
            "event": "on_copilotkit_state_sync",
            "thread_id": thread_id,
            "run_id": run_id,
            "agent_name": self.name,
            "node_name": node_name,
            "active": active,
            "state": state,
            "running": running,
            "role": "assistant"
        })

    async def get_state(
        self,
        *,
        thread_id: str,
    ):
        """Get the current state for a thread"""
        if not thread_id:
            return {
                "threadId": "",
                "threadExists": False,
                "state": {},
                "messages": []
            }
        
        state = self.thread_state.get(thread_id, {})
        if not state:
            return {
                "threadId": thread_id or "",
                "threadExists": False,
                "state": {},
                "messages": []
            }
        
        # Extract messages and convert to CopilotKit format
        pydantic_messages = state.get("messages", [])
        messages = pydantic_ai_messages_to_copilotkit(pydantic_messages)
        
        # Remove messages from state copy
        state_copy = state.copy()
        state_copy.pop("messages", None)
        
        return {
            "threadId": thread_id,
            "threadExists": True,
            "state": state_copy,
            "messages": messages
        }

    def dict_repr(self):
        """Dictionary representation of the agent"""
        super_repr = super().dict_repr()
        return {
            **super_repr,
            'type': 'pydantic_ai'
        }
