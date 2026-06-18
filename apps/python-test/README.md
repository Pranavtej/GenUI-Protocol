# GenUI AI Agent

A LangChain-powered AI agent that generates GenUI Protocol AST documents from natural language descriptions. Uses the GenUI MCP server for component discovery, validation, and AST generation.

## Features

- **Natural Language to UI** — Describe what you want and get a valid AST
- **Multi-Provider** — Supports OpenAI (GPT-4o) and Anthropic (Claude)
- **MCP Integration** — Leverages the GenUI MCP server for component discovery and validation
- **Interactive CLI** — Beautiful terminal UI with real-time agent reasoning
- **AST Validation** — Automatically validates generated ASTs against schemas
- **Template Library** — Quick-start templates for common patterns

## Quick Start

```bash
# Install
pip install -e ".[dev]"

# Configure
cp env.example .env
# Edit .env with your API keys

# Start the MCP server (in another terminal)
cd apps/mcp-server && pnpm dev

# Launch the agent
genui chat

# Or generate from a prompt directly
genui generate "Create a dashboard with 3 KPI cards and a chart"
```

## Commands

| Command | Description |
|---------|-------------|
| `genui chat` | Interactive chat session with the agent |
| `genui generate <prompt>` | Generate an AST from a single prompt |
| `genui template <type>` | Generate a template AST (dashboard, form, analytics, etc.) |
| `genui validate <file>` | Validate an AST from a JSON file |
| `genui explore` | Explore available components in the registry |

## Examples

```bash
# Generate a login form
genui generate "A login form with email, password, and a submit button"

# Generate a full analytics dashboard
genui generate "A dashboard showing revenue KPIs, a traffic chart, and recent transactions table"

# Start interactive session
genui chat
```

## Architecture

```
User (CLI)
  │
  ▼
┌─────────────────────┐
│  LangGraph Agent     │  ← Plans, uses tools, generates AST
│  (OpenAI / Claude)   │
└──────┬──────────────┘
       │ Tool calls (HTTP)
       ▼
┌─────────────────────┐
│  GenUI MCP Server    │  ← Component discovery, validation, templates
│  (apps/mcp-server)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Component Registry  │  ← Schema-driven component metadata
└─────────────────────┘
```
