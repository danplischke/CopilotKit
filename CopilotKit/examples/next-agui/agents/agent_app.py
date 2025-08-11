import os
import json
from typing import Any, Dict, List

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pydantic_ai import Agent

os.environ["OPENAI_API_KEY"] = "asjdhakhdkhas"

def _build_agent(system_prompt: str, model_name: str) -> Agent:
    # Map OLLAMA_* env vars to OpenAI provider env if not already set
    openai_base = os.getenv("OPENAI_BASE_URL")
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_base and os.getenv("OLLAMA_BASE_URL"):
        os.environ["OPENAI_BASE_URL"] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    if not openai_key and os.getenv("OLLAMA_API_KEY"):
        os.environ["OPENAI_API_KEY"] = os.getenv("OLLAMA_API_KEY", "ollama")

    # Use OpenAI provider string, pydantic-ai will read OPENAI_* env vars
    return Agent(f"openai:{model_name}", instructions=system_prompt)


_AGENT_CACHE: Dict[str, Agent] = {}


def create_app(
    *,
    agent_name: str,
    description: str,
    system_prompt: str,
    default_model: str = "llama3.1",
) -> FastAPI:
    app = FastAPI(title=f"ag_ui agent: {agent_name}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    @app.get("/agents")
    def agents_list() -> List[Dict[str, Any]]:
        return [
            {
                "name": agent_name,
                "id": agent_name,
                "description": description,
            }
        ]

    @app.post(f"/agents/{{name}}/state")
    async def agent_state(name: str, request: Request) -> JSONResponse:
        # Stateless example; return empty state/messages
        _ = await request.body()
        return JSONResponse({
            "state": json.dumps({}),
            "messages": json.dumps([]),
        })

    # Build or fetch a cached Agent for this server's agent_name
    model_name = os.getenv("OLLAMA_MODEL", default_model)
    cached = _AGENT_CACHE.get(agent_name)
    if cached is None:
        cached = _build_agent(system_prompt, model_name)
        _AGENT_CACHE[agent_name] = cached

    # Mount the AG-UI ASGI app at the expected run path
    # Client will POST to /agents/{agent_name}/run and this sub-app will handle it at '/'
    app.mount(f"/agents/{agent_name}/run", cached.to_ag_ui())

    return app


