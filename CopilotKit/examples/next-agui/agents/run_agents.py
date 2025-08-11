import os
import uvicorn
from multiprocessing import Process
from agent_app import create_app


def run(name: str, description: str, system_prompt: str, port: int, model: str = "llama3.1"):
    app = create_app(
        agent_name=name,
        description=description,
        system_prompt=system_prompt,
        default_model=model,
    )
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


def main():
    # You can override model via env OLLAMA_MODEL / OLLAMA_BASE_URL
    processes = [
        Process(
            target=run,
            args=(
                "support",
                "Customer support agent",
                "You are a helpful customer support assistant.",
                8000,
            ),
        ),
        Process(
            target=run,
            args=(
                "technical",
                "Technical assistant",
                "You are a senior software engineer helping with code, debugging and architecture.",
                8001,
            ),
        ),
        Process(
            target=run,
            args=(
                "creative",
                "Creative writing assistant",
                "You are a creative writing assistant that crafts engaging content.",
                8002,
            ),
        ),
    ]

    for p in processes:
        p.start()

    for p in processes:
        p.join()


if __name__ == "__main__":
    main()


