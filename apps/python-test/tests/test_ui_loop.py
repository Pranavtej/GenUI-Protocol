"""UI generation loop helpers and the agent's validate/repair behaviour (no network, no real LLM)."""

import json

from langchain_core.messages import AIMessage, HumanMessage

from src.agent.saas_agent import FlowAIAgent
from src.agent.ui_loop import as_document, check, extract_document, repair_prompt, ui_event_message

VALID = {"version": "1.0.0", "data": {"n": 1}, "root": {"t": "page", "p": {"title": "Hi"}, "c": [{"t": "text", "p": {"content": {"$bind": "n"}}}]}}
INVALID = {"version": "1.0.0", "root": {"t": "page", "p": {"title": "Hi"}, "c": [{"t": "nope"}]}}


def fenced(doc):
    return "Here you go:\n```json\n" + json.dumps(doc) + "\n```"


def test_extract_document_from_fences_bare_json_and_prose():
    assert extract_document(fenced(VALID)) == VALID
    assert extract_document(json.dumps(VALID)) == VALID
    assert extract_document("no ui here, just text") is None
    assert extract_document("```json\n{not json}\n```") is None
    assert as_document({"t": "page", "p": {"title": "x"}}) == {"version": "1.0.0", "root": {"t": "page", "p": {"title": "x"}}}
    assert as_document({"foo": 1}) is None


def test_check_accepts_documents_and_bare_roots():
    assert check(VALID).valid
    assert check(VALID["root"]).valid
    bad = check(INVALID)
    assert not bad.valid and "Unknown component" in bad.errors[0]


def test_repair_prompt_lists_errors_and_event_message_is_readable():
    assert "- Unknown component type" in repair_prompt(["Unknown component type"])
    msg = ui_event_message({"name": "signup", "payload": {"data": {"name": "Ada"}}, "nodeId": "go"})
    assert "'signup'" in msg and "node 'go'" in msg and '"Ada"' in msg and msg.startswith("[ui-event]")


class FakeLLM:
    """Returns scripted replies and records what it was asked."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.seen = []

    def bind_tools(self, _tools):
        return self

    def invoke(self, messages):
        self.seen.append(list(messages))
        return AIMessage(content=self.replies.pop(0))


class FakeClient:
    def guide(self):
        return {"systemPrompt": "GUIDE: use $bind and actions"}


def agent(replies):
    llm = FakeLLM(replies)
    return FlowAIAgent(client=FakeClient(), llm=llm, use_rag=False), llm


def events_of(gen):
    return list(gen)


def test_valid_document_is_streamed_as_ast():
    a, llm = agent([fenced(VALID)])
    events = events_of(a.stream_chat("show me a page"))
    assert [e["type"] for e in events] == ["text", "ast", "done"]
    assert events[1]["content"] == VALID
    assert "GUIDE: use $bind and actions" in llm.seen[0][0].content  # server guide is in the system prompt


def test_invalid_document_is_repaired_with_the_exact_errors_and_never_shown():
    a, llm = agent([fenced(INVALID), fenced(VALID)])
    events = events_of(a.stream_chat("show me a page"))
    types = [e["type"] for e in events]
    assert types == ["thinking", "text", "ast", "done"]
    assert events[2]["content"] == VALID
    repair = llm.seen[1][-1]
    assert isinstance(repair, HumanMessage) and "Unknown component type" in repair.content


def test_gives_up_after_max_repairs_without_emitting_an_invalid_ui():
    a, _ = agent([fenced(INVALID)] * 3)
    events = events_of(a.stream_chat("x"))
    assert "ast" not in [e["type"] for e in events]
    assert any(e["type"] == "error" for e in events)


def test_plain_text_answers_pass_through():
    a, _ = agent(["Our Pro plan costs $49."])
    assert [e["type"] for e in events_of(a.stream_chat("price?"))] == ["text", "done"]


def test_ui_events_become_a_follow_up_turn_with_history():
    a, llm = agent([fenced(VALID), "Thanks, Ada is signed up."])
    events_of(a.stream_chat("show a signup form"))
    events = events_of(a.handle_ui_event({"name": "signup", "payload": {"data": {"name": "Ada"}}, "nodeId": "go"}))
    assert events[0] == {"type": "text", "content": "Thanks, Ada is signed up."}
    second_call = llm.seen[1]
    assert any(isinstance(m, HumanMessage) and "show a signup form" in m.content for m in second_call)  # earlier turn kept
    assert "[ui-event]" in second_call[-1].content
    assert [m["role"] for m in a.get_history()][:2] == ["user", "assistant"]
    a.reset_thread()
    assert a.get_history() == []
