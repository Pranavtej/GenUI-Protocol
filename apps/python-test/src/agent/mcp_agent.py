"""LangGraph agent that uses MCP tools to generate GenUI ASTs."""

from typing import Any
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, MessagesState, START
from langgraph.prebuilt import ToolNode, tools_condition

from src.client.mcp_client import MCPC˳lient
from src.agent.tools import create_tools
from src.config import settings

SYSTEM_PROMPT = """You are a GenUI Protocol expert — an AI agent that generates universal UI interfaces using the GenUI Protocol AST format.

## Your Job
When a user describes a UI they want, you:
1. **Discover** what components are available via the MCP server
2. **Plan** the component tree based on the user's description
3. **Build** a valid AST using `generate_ast`
4. **Validate** the AST to ensure correctness
5. **Present** the final AST to the user with a visual tree summary

## AST Format
```json
{
  "version": "1.0.0",
  "root": {
    "t": "type_name",
    "p": { "prop1": "value1" },
    "c": [ { "t": "child_type", ... } ]
  }
}
```

## Key Rules
- Always use `discover_components` or `get_component` first to understand what's available
- For complex UIs, plan the tree structure before generating
- Always validate the generated AST before presenting it
- If validation fails, fix the issues and re-validate
- Explain your reasoning clearly to the user
- The `t` field is the component type (e.g., "kpi", "card", "button")
- The `p` field contains component properties
- The `c` field contains child nodes

## Component Categories
- **layout**: page, section, card, grid, flex, stack, dashboard
- **general**: text, heading, button, tabs
- **forms**: input, textarea, select, checkbox
- **data**: table, chart, kpi, timeline
- **overlay**: dialog, drawer
- **workflows**: workflow, executionGraph
"""


def create_llm():
    """Create the LLM based on configured provider."""
    if settings.llm_provider == "anthropic":
        return ChatAnthropic(
            model=settings.anthropic_model,
            anthropic_api_key=settings.resolved_anthropic_key,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
        )
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.resolved_openai_key,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
    )


class GenUIAgent:
    """LangGraph-based agent that uses MCP tools for AST generation."""

    def __init__(self, client: MCPClient | None = None) -> None:
        self._client = client or MCPClient(settings.mcp_base_url)
        self._llm = create_llm()
        self._tools = create_tools(self._client)
        self._memory = MemorySaver()
        self._graph = self._build_graph()

    def _build_graph(self):
        llm_with_tools = self._llm.bind_tools(self._tools)

        def call_model(state: MessagesState) -> dict:
            messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
            response = llm_with_tools.invoke(messages)
            return {"messages": [response]}

        tool_node = ToolNode(self._tools)

        builder = StateGraph(MessagesState)
        builder.add_node("agent", call_model)
        builder.add_node("tools", tool_node)
        builder.add_edge(START, "agent")
        builder.add_conditional_edges("agent", tools_condition)
        builder.add_edge("tools", "agent")

        return builder.compile(checkpointer=self._memory)

    @property
    def graph(self):
        return self._graph

    def chat(self, message: str, thread_id: str = "default", stream: bool = False) -> Any:
        """Send a message and get a response."""
        config = {"configurable": {"thread_id": thread_id}}
        if stream:
            return self._graph.stream(
                {"messages": [HumanMessage(content=message)]},
                config,
                stream_mode="values",
            )
        result = self._graph.invoke(
            {"messages": [HumanMessage(content=message)]},
            config,
        )
        return result["messages"][-1].content

    def stream_chat(self, message: str, thread_id: str = "default"):
        """Stream the agent's response token by token."""
        config = {"configurable": {"thread_id": thread_id}}

        for event in self._graph.stream(
            {"messages": [HumanMessage(content=message)]},
            config,
            stream_mode="values",
        ):
            msg = event.get("messages", [None])[-1]
            if msg and hasattr(msg, "content") and msg.content:
                yield msg

    def get_history(self, thread_id: str = "default") -> list[dict[str, str]]:
        """Get conversation history for a thread."""
        state = self._graph.get_state({"configurable": {"thread_id": thread_id}})
        history = []
        if state and state.values:
            for msg in state.values.get("messages", []):
                role = "user" if isinstance(msg, HumanMessage) else "assistant"
                if isinstance(msg, AIMessage) and msg.tool_calls:
                    continue
                if msg.content:
                    history.append({"role": role, "content": msg.content})
        return history

    def reset_thread(self, thread_id: str = "default") -> None:
        """Reset conversation history for a thread."""
        self._memory = MemorySaver()
        self._graph = self._build_graph()
