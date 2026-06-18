import json
from typing import Any, Generator

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from src.client.mcp_client import MCPClient
from src.agent.tools import create_tools
from src.knowledge.embeddings import vector_store
from src.config import settings

SAAS_SYSTEM_PROMPT = """You are **FlowAI Assistant** — an AI support and analytics agent for FlowAI, a revenue intelligence platform.

## Your Role
You help FlowAI customers and internal teams with:
- Answering questions about FlowAI products, features, and pricing
- Providing analytics and insights from company data
- Generating UI dashboards and visualizations using GenUI Protocol AST

## Knowledge Base
Below is relevant context from FlowAI's knowledge base. Use it to answer questions accurately.

{rag_context}

## UI Generation
When the user asks for data visualization, dashboards, or UI, use the MCP tools available to you:
1. First understand what components are available via `discover_components`
2. Plan the UI structure
3. Use `generate_ast` to create the AST
4. Use `validate_ast` to ensure correctness

## Response Style
- Be helpful, concise, and data-driven
- When presenting data, use the actual metrics from the knowledge base
- When generating UI AST, explain what you're building
- If you don't have enough context, acknowledge it honestly
"""


def create_llm():
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


def _init_vector_store():
    if not vector_store.is_initialized:
        try:
            vector_store.initialize()
        except Exception as e:
            import warnings
            warnings.warn(f"Vector store init failed: {e}. RAG disabled.")


class FlowAIAgent:
    def __init__(self, client: MCPClient | None = None):
        self._client = client or MCPClient(settings.mcp_base_url)
        self._llm = create_llm()
        self._tools = create_tools(self._client)
        self._tool_map = {t.name: t for t in self._tools}
        _init_vector_store()

    def stream_chat(self, message: str) -> Generator[dict[str, Any], None, None]:
        rag_context = ""
        if vector_store.is_initialized:
            rag_context = vector_store.format_context(message)

        system = SAAS_SYSTEM_PROMPT.format(rag_context=rag_context or "No specific context available.")
        messages: list = [SystemMessage(content=system), HumanMessage(content=message)]
        llm_with_tools = self._llm.bind_tools(self._tools)

        for _ in range(10):
            response = llm_with_tools.invoke(messages)
            messages.append(response)

            if hasattr(response, "tool_calls") and response.tool_calls:
                for tc in response.tool_calls:
                    yield {"type": "tool_call", "name": tc["name"], "args": tc.get("args", {})}
                    tool_fn = self._tool_map.get(tc["name"])
                    if tool_fn:
                        try:
                            result = tool_fn.invoke(tc.get("args", {}))
                            result_str = str(result)
                        except Exception as e:
                            result_str = f"Error executing {tc['name']}: {e}"
                    else:
                        result_str = f"Tool {tc['name']} not found"

                    yield {"type": "tool_result", "name": tc["name"], "content": result_str}

                    if tc["name"] == "generate_ast":
                        try:
                            import re
                            json_match = re.search(r'```json\n(.*?)\n```', result_str, re.DOTALL)
                            if json_match:
                                ast_data = json.loads(json_match.group(1))
                                yield {"type": "ast", "content": ast_data}
                        except Exception:
                            pass

                    messages.append(ToolMessage(content=result_str, tool_call_id=tc["id"]))

                yield {"type": "thinking", "content": "Processing tool results..."}
            else:
                content = response.content if hasattr(response, "content") else str(response)
                if content:
                    yield {"type": "text", "content": content}
                    ast = self._extract_ast_from_text(content)
                    if ast:
                        yield {"type": "ast", "content": ast}
                break
        else:
            yield {"type": "text", "content": "I'm having trouble processing your request. Please try again."}

        yield {"type": "done"}

    def chat(self, message: str) -> str:
        rag_context = ""
        if vector_store.is_initialized:
            rag_context = vector_store.format_context(message)

        system = SAAS_SYSTEM_PROMPT.format(rag_context=rag_context or "No specific context available.")
        messages: list = [SystemMessage(content=system), HumanMessage(content=message)]
        llm_with_tools = self._llm.bind_tools(self._tools)

        for _ in range(10):
            response = llm_with_tools.invoke(messages)
            messages.append(response)

            if hasattr(response, "tool_calls") and response.tool_calls:
                for tc in response.tool_calls:
                    tool_fn = self._tool_map.get(tc["name"])
                    if tool_fn:
                        try:
                            result = tool_fn.invoke(tc.get("args", {}))
                            result_str = str(result)
                        except Exception as e:
                            result_str = f"Error: {e}"
                    else:
                        result_str = f"Tool {tc['name']} not found"
                    messages.append(ToolMessage(content=result_str, tool_call_id=tc["id"]))
            else:
                content = response.content if hasattr(response, "content") else str(response)
                return content or "No response generated."

        return "I'm having trouble processing your request. Please try again."

    def get_history(self, thread_id: str = "default") -> list[dict[str, str]]:
        return []

    def reset_thread(self, thread_id: str = "default") -> None:
        pass

    def _extract_ast_from_text(self, text: str) -> dict | None:
        import re
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        return None
