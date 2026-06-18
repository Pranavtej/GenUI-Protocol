"""CLI entry point for the GenUI AI Agent."""

import json
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.live import Live
from rich.spinner import Spinner

from src.client.mcp_client import MCPClient
from src.agent.mcp_agent import GenUIAgent
from src.config import settings

app = typer.Typer(
    name="genui",
    help="GenUI AI Agent — generate UIs from natural language",
    no_args_is_help=True,
)
console = Console()
_err = Console(stderr=True)


def _check_credentials():
    if not settings.has_credentials:
        _err.print(
            "[bold red]Error:[/] No API credentials found.\n"
            f"Set [bold]OPENAI_API_KEY[/] or [bold]ANTHROPIC_API_KEY[/] in your .env file.\n"
            f"Provider: [bold]{settings.llm_provider}[/]"
        )
        raise typer.Exit(1)


def _check_mcp():
    try:
        client = MCPClient(settings.mcp_base_url)
        health = client.health()
        client.close()
        if health.get("status") != "ok":
            raise typer.Exit(1)
    except Exception as e:
        _err.print(f"[bold red]Error:[/] Cannot connect to MCP server at [bold]{settings.mcp_base_url}[/]")
        _err.print(f"  {e}")
        _err.print("\nStart the server with: [bold]cd apps/mcp-server && pnpm dev[/]")
        raise typer.Exit(1)


# ---- Commands --------------------------------------------------------------


@app.command()
def chat():
    """Start an interactive chat session with the AI agent."""
    _check_credentials()
    _check_mcp()

    agent = GenUIAgent()
    console.print(Panel.fit(
        "[bold]GenUI AI Agent[/]\n"
        "Describe the UI you want in natural language. Type [bold]/exit[/] to quit, [bold]/reset[/] to clear context.",
        border_style="blue",
    ))

    while True:
        message = Prompt.ask("\n[bold cyan]You[/]")
        if message.strip().lower() in ("/exit", "/quit"):
            break
        if message.strip().lower() == "/reset":
            agent.reset_thread()
            console.print("[yellow]Context cleared.[/]")
            continue

        with console.status("[bold green]Agent thinking...", spinner="dots"):
            try:
                response = agent.chat(message)
            except Exception as e:
                _err.print(f"[bold red]Error:[/] {e}")
                continue

        console.print()
        console.print(Panel(Markdown(response), border_style="green", title="[bold]Agent[/]"))
        console.print()


@app.command()
def generate(prompt: str):
    """Generate an AST from a single natural language prompt."""
    _check_credentials()
    _check_mcp()

    agent = GenUIAgent()
    with console.status("[bold green]Generating...", spinner="dots"):
        try:
            response = agent.chat(prompt)
        except Exception as e:
            _err.print(f"[bold red]Error:[/] {e}")
            raise typer.Exit(1)

    console.print(Panel(Markdown(response), border_style="green", title="[bold]Generated AST[/]"))


@app.command()
def template(type: str = typer.Argument("dashboard", help="Template type: dashboard, workflow, form, analytics, chat, settings, blank")):
    """Generate a boilerplate AST template."""
    _check_mcp()

    client = MCPClient(settings.mcp_base_url)
    try:
        doc = client.generate_template(type)
    except Exception as e:
        _err.print(f"[bold red]Error:[/] {e}")
        raise typer.Exit(1)
    finally:
        client.close()

    console.print(Panel(json.dumps(doc, indent=2), border_style="blue", title=f"[bold]{type.title()} Template[/]"))


@app.command()
def validate(file: str):
    """Validate an AST from a JSON file."""
    _check_mcp()

    path = Path(file)
    if not path.exists():
        _err.print(f"[bold red]Error:[/] File not found: {file}")
        raise typer.Exit(1)

    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        _err.print(f"[bold red]Error:[/] Invalid JSON: {e}")
        raise typer.Exit(1)

    root = data.get("root", data)
    client = MCPClient(settings.mcp_base_url)
    try:
        result = client.validate_ast(root)
    except Exception as e:
        _err.print(f"[bold red]Error:[/] {e}")
        raise typer.Exit(1)
    finally:
        client.close()

    if result.valid:
        console.print("[bold green]✅ AST is valid![/]")
    else:
        console.print("[bold red]❌ Validation failed:[/]")
        for err in (result.errors or []):
            console.print(f"  - {err}")
        raise typer.Exit(1)


@app.command()
def explore():
    """Explore available components in the GenUI registry."""
    _check_mcp()

    client = MCPClient(settings.mcp_base_url)
    try:
        components = client.discover_components()
        renderers = client.list_renderers()
    except Exception as e:
        _err.print(f"[bold red]Error:[/] {e}")
        raise typer.Exit(1)
    finally:
        client.close()

    console.print(f"[bold]GenUI Protocol — Component Registry[/]\n")

    table = Table(show_header=True, header_style="bold")
    table.add_column("Component", style="cyan")
    table.add_column("Category")
    table.add_column("Events")
    table.add_column("Description")

    categories: dict[str, list] = {}
    for c in components:
        cat = c.get("category", "other")
        categories.setdefault(cat, []).append(c)

    for cat, comps in sorted(categories.items()):
        table.add_section()
        table.add_row(f"[bold yellow]{cat.upper()}[/]", "", "", "")
        for comp in comps:
            events = ", ".join(comp.get("events", [])) or "—"
            desc = (comp.get("description") or "")[:60]
            table.add_row(f"  {comp['id']}", "", events, desc)

    console.print(table)
    console.print(f"\n[dim]Renderers: {', '.join(renderers)}[/]")


@app.command()
def serve():
    """Start the API server mode for the Angular frontend to connect to."""
    _check_credentials()
    _check_mcp()

    try:
        from fastapi import FastAPI, HTTPException
        from pydantic import BaseModel
        import uvicorn
    except ImportError:
        _err.print("[bold red]Error:[/] Install server extras: [bold]pip install 'genui-ai-agent[server]'[/]")
        _err.print("  or: pip install fastapi uvicorn")
        raise typer.Exit(1)

    agent_store: dict[str, GenUIAgent] = {}

    def get_agent(thread_id: str = "default") -> GenUIAgent:
        if thread_id not in agent_store:
            agent_store[thread_id] = GenUIAgent()
        return agent_store[thread_id]

    api = FastAPI(title="GenUI Agent API", version="0.1.0")

    class ChatRequest(BaseModel):
        message: str
        thread_id: str = "default"

    class ChatResponse(BaseModel):
        response: str
        thread_id: str

    @api.post("/chat", response_model=ChatResponse)
    def chat_endpoint(req: ChatRequest):
        agent = get_agent(req.thread_id)
        try:
            response = agent.chat(req.message, thread_id=req.thread_id)
            return ChatResponse(response=response, thread_id=req.thread_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @api.post("/chat/stream")
    def chat_stream_endpoint(req: ChatRequest):
        from fastapi.responses import StreamingResponse

        agent = get_agent(req.thread_id)

        def generate():
            for msg in agent.stream_chat(req.message, thread_id=req.thread_id):
                if msg.content:
                    yield f"data: {json.dumps({'content': msg.content})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    @api.get("/history/{thread_id}")
    def get_history(thread_id: str = "default"):
        agent = get_agent(thread_id)
        return {"thread_id": thread_id, "messages": agent.get_history(thread_id)}

    @api.delete("/history/{thread_id}")
    def reset_history(thread_id: str = "default"):
        if thread_id in agent_store:
            agent_store[thread_id].reset_thread()
        return {"status": "reset", "thread_id": thread_id}

    @api.get("/health")
    def health():
        client = MCPClient(settings.mcp_base_url)
        try:
            mcp_health = client.health()
        except Exception as e:
            mcp_health = {"status": "error", "detail": str(e)}
        finally:
            client.close()
        return {
            "status": "ok",
            "provider": settings.llm_provider,
            "mcp_server": mcp_health,
            "model": settings.openai_model if settings.llm_provider == "openai" else settings.anthropic_model,
        }

    console.print(f"[bold green]Agent API starting on http://{settings.api_host}:{settings.api_port}[/]")
    console.print(f"[dim]Provider: {settings.llm_provider}[/]")
    console.print(f"[dim]MCP Server: {settings.mcp_base_url}[/]")
    uvicorn.run(api, host=settings.api_host, port=settings.api_port)


if __name__ == "__main__":
    app()
