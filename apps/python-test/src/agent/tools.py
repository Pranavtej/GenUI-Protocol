"""LangChain tools wrapping the MCP client for use by the AI agent."""

from typing import Any
from langchain_core.tools import tool
from src.client.mcp_client import MCPClient


def create_tools(client: MCPClient) -> list[dict[str, Any]]:
    """Create LangChain-compatible tool definitions from MCP client methods."""

    @tool
    def discover_components() -> str:
        """List all components available in the GenUI Protocol with their categories and descriptions. Use this to understand what UI building blocks exist."""
        components = client.discover_components()
        lines = []
        for c in components:
            events = f" [events: {', '.join(c.get('events', []))}]" if c.get("events") else ""
            lines.append(f"- **{c['id']}** ({c['category']}){events}: {c.get('description', '')}")
        return "\n".join(lines)

    @tool
    def get_component(name: str) -> str:
        """Get the full specification for a component including its properties, events, and examples. Pass the component name (e.g., 'kpi', 'chart', 'button')."""
        try:
            comp = client.get_component(name)
            return (
                f"## {comp['id']}\n"
                f"- **Category**: {comp.get('category')}\n"
                f"- **Description**: {comp.get('description', 'N/A')}\n"
                f"- **Events**: {', '.join(comp.get('events', [])) or 'none'}\n"
                f"- **Schema**: ```json\n{comp.get('schema', {})}\n```\n"
                f"- **Examples**: ```json\n{comp.get('examples', [])}\n```"
            )
        except Exception as e:
            return f"Error: {e}"

    @tool
    def search_components(query: str) -> str:
        """Search for components by name or description. Returns matching components with relevance."""
        results = client.search_components(query)
        if not results:
            return f"No components found matching '{query}'."
        lines = [f"Found {len(results)} component(s):"]
        for r in results:
            lines.append(f"- **{r['id']}** ({r.get('category')}): {r.get('description', '')}")
        return "\n".join(lines)

    @tool
    def suggest_components(description: str) -> str:
        """Get AI-suggested components for a given UI description. Describe what you want to build (e.g., 'a login form with email and password')."""
        suggestions = client.suggest_components(description)
        if not suggestions:
            return "No specific component suggestions found. Try describing your UI more broadly."
        lines = ["Suggested components:"]
        for s in suggestions:
            comp = s.get("component", {})
            score = s.get("score", 0)
            stars = "*" * min(score, 5)
            lines.append(f"- **{comp.get('id')}** ({comp.get('category')}) {stars}")
        return "\n".join(lines)

    @tool
    def generate_ast(root_json: str) -> str:
        """Generate a complete, valid AST document from a JSON structure. Provide the root node as a JSON string with 't' (type), 'p' (props), and 'c' (children) fields. Returns the full ASTDocument with auto-generated IDs."""
        import json
        try:
            root = json.loads(root_json)
        except json.JSONDecodeError as e:
            return f"Invalid JSON: {e}"
        doc = client.generate_ast(root)
        return f"```json\n{json.dumps(doc, indent=2)}\n```"

    @tool
    def generate_template(template_type: str) -> str:
        """Generate a boilerplate AST template. Types: dashboard, workflow, form, analytics, chat, settings, blank."""
        doc = client.generate_template(template_type)
        import json
        return f"```json\n{json.dumps(doc, indent=2)}\n```"

    @tool
    def validate_ast(root_json: str) -> str:
        """Validate an AST against GenUI Protocol schemas. Provide the root UINode as a JSON string."""
        import json
        try:
            root = json.loads(root_json) if isinstance(root_json, str) else root_json
        except json.JSONDecodeError as e:
            return f"Invalid JSON: {e}"
        result = client.validate_ast(root)
        if result.valid:
            return "✅ AST is valid!"
        errors = "\n".join(f"- {e}" for e in (result.errors or []))
        return f"❌ Validation failed:\n{errors}"

    @tool
    def ast_metadata(root_json: str) -> str:
        """Get metadata about an AST tree: node count, depth, component types used, and properties. Provide the root UINode as a JSON string."""
        import json
        try:
            root = json.loads(root_json)
        except json.JSONDecodeError as e:
            return f"Invalid JSON: {e}"
        meta = client.ast_metadata(root)
        types_str = ", ".join(f"{t}: {c}" for t, c in sorted(meta.get("types", {}).items(), key=lambda x: -x[1]))
        return (
            f"- **Total Nodes**: {meta.get('count')}\n"
            f"- **Max Depth**: {meta.get('maxDepth')}\n"
            f"- **Component Types**: {types_str}\n"
            f"- **Properties Used**: {', '.join(meta.get('usedProps', [])) or 'none'}"
        )

    @tool
    def list_renderers() -> str:
        """List all UI frameworks that can render GenUI ASTs."""
        renderers = client.list_renderers()
        return "Supported renderers:\n" + "\n".join(f"- {r}" for r in renderers)

    return [
        discover_components,
        get_component,
        search_components,
        suggest_components,
        generate_ast,
        generate_template,
        validate_ast,
        ast_metadata,
        list_renderers,
    ]
