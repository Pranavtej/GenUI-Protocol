import json
from typing import Any, Generator

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from src.agent.ui_loop import MAX_REPAIRS, check, extract_document, repair_prompt, ui_event_message
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
When the user asks for data visualization, dashboards, forms, or any UI, answer with a GenUI document (JSON in a ```json block):
1. The protocol rules and component catalogue are below. Use only those components and props.
2. Put data in `data` and reference it with `$bind` / `$tpl`; wire interactions with declarative actions.
3. Call `validate_ast` with the full document and fix every error before you answer.
4. Messages starting with `[ui-event]` are the user interacting with a UI you rendered: react to them.

{protocol_guide}

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


MAX_HISTORY_MESSAGES = 40

FALLBACK_GUIDE = "Use ```json blocks containing {\"version\":\"1.0.0\",\"root\":{\"t\":...,\"p\":{...},\"c\":[...]}}; call discover_components for the available components."


class FlowAIAgent:
    def __init__(self, client: MCPClient | None = None, llm: Any = None, use_rag: bool = True):
        self._client = client or MCPClient(settings.mcp_base_url, api_key=settings.mcp_api_key or None)
        self._llm = llm or create_llm()
        self._tools = create_tools(self._client)
        self._tool_map = {t.name: t for t in self._tools}
        self._use_rag = use_rag
        self._history: list = []  # earlier turns, so follow-ups and UI events keep their context
        self._guide: str | None = None
        if use_rag:
            _init_vector_store()

    def _protocol_guide(self) -> str:
        """The server's up-to-date rules and component catalogue (cached; falls back offline)."""
        if self._guide is None:
            try:
                self._guide = self._client.guide()["systemPrompt"]
            except Exception:
                return FALLBACK_GUIDE
        return self._guide

    def _system_prompt(self, message: str) -> str:
        rag_context = vector_store.format_context(message) if self._use_rag and vector_store.is_initialized else ""
        return SAAS_SYSTEM_PROMPT.format(rag_context=rag_context or "No specific context available.", protocol_guide=self._protocol_guide())

    def handle_ui_event(self, event: dict[str, Any]) -> Generator[dict[str, Any], None, None]:
        """Feeds an event from the rendered UI (emit/submit action) back to the agent as a new turn."""
        return self.stream_chat(ui_event_message(event))

    def stream_chat(self, message: str) -> Generator[dict[str, Any], None, None]:
        messages: list = [SystemMessage(content=self._system_prompt(message)), *self._history, HumanMessage(content=message)]
        llm_with_tools = self._llm.bind_tools(self._tools)
        repairs = 0
        try:
            yield from self._run_turn(messages, llm_with_tools, repairs)
        finally:
            self._remember(messages)

    def _remember(self, messages: list) -> None:
        """Keeps the last turns (never starting on an orphan tool result) for the next call."""
        kept = messages[1:][-MAX_HISTORY_MESSAGES:]
        while kept and not isinstance(kept[0], HumanMessage):
            kept = kept[1:]
        self._history = kept

    def _run_turn(self, messages: list, llm_with_tools: Any, repairs: int) -> Generator[dict[str, Any], None, None]:

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
                if not isinstance(content, str):
                    content = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in content)
                doc = extract_document(content) if content else None
                if doc is not None:
                    result = check(doc)
                    if not result.valid and repairs < MAX_REPAIRS:
                        # Never show an invalid UI: ask the model to fix it, with the exact errors.
                        repairs += 1
                        yield {"type": "thinking", "content": f"Fixing {len(result.errors)} validation error(s)..."}
                        messages.append(HumanMessage(content=repair_prompt(result.errors)))
                        continue
                    if not result.valid:
                        yield {"type": "text", "content": content}
                        yield {"type": "error", "content": "The generated UI is invalid: " + "; ".join(result.errors[:5])}
                        break
                if content:
                    yield {"type": "text", "content": content}
                if doc is not None:
                    yield {"type": "ast", "content": doc}
                break
        else:
            yield {"type": "text", "content": "I'm having trouble processing your request. Please try again."}

        yield {"type": "done"}

    def chat(self, message: str) -> str:
        messages: list = [SystemMessage(content=self._system_prompt(message)), HumanMessage(content=message)]
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
        return [
            {"role": "user" if isinstance(m, HumanMessage) else "assistant", "content": m.content if isinstance(m.content, str) else str(m.content)}
            for m in self._history
            if isinstance(m, (HumanMessage, AIMessage)) and m.content
        ]

    def reset_thread(self, thread_id: str = "default") -> None:
        self._history = []

    def _extract_ast_from_text(self, text: str) -> dict | None:
        import re
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        return None
