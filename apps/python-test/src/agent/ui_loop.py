"""Pure helpers for the UI generation loop: extract a document from model output, check it, ask for repairs,
and turn UI events (emit/submit actions) back into chat messages. No LLM or network imports."""

from __future__ import annotations

import json
import re
from typing import Any

from genui_protocol_sdk import ValidationResult, validate_document, validate_node

MAX_REPAIRS = 2

_FENCE = re.compile(r"```(?:json|ast)?\s*\n(.*?)\n```", re.DOTALL)


def extract_json_candidates(text: str) -> list[Any]:
    """Every fenced block that parses as JSON, plus the whole text if it is bare JSON."""
    found: list[Any] = []
    for block in _FENCE.findall(text):
        try:
            found.append(json.loads(block))
        except json.JSONDecodeError:
            continue
    if not found:
        try:
            found.append(json.loads(text))
        except (json.JSONDecodeError, TypeError):
            pass
    return found


def as_document(value: Any) -> dict[str, Any] | None:
    """Accepts a full document, or a bare root node (wrapped for convenience). Returns None for anything else."""
    if not isinstance(value, dict):
        return None
    if "root" in value and "version" in value:
        return value
    if isinstance(value.get("t"), str):
        return {"version": "1.0.0", "root": value}
    return None


def extract_document(text: str) -> dict[str, Any] | None:
    for candidate in extract_json_candidates(text):
        doc = as_document(candidate)
        if doc is not None:
            return doc
    return None


def check(value: Any) -> ValidationResult:
    """Validates a document (or bare root node)."""
    if isinstance(value, dict) and "root" in value:
        return validate_document(value)
    return validate_node(value)


def repair_prompt(errors: list[str]) -> str:
    listed = "\n".join(f"- {e}" for e in errors[:20])
    return (
        "The UI document you produced is invalid. Fix every problem below and reply with the corrected document only "
        f"(same format as before).\n\n{listed}"
    )


def ui_event_message(event: dict[str, Any]) -> str:
    """Formats an event sent back from the rendered UI (an `emit` / `submit` action) as a chat message."""
    name = str(event.get("name", "unknown"))
    payload = json.dumps(event.get("payload", {}), ensure_ascii=False)
    node = f" from node '{event['nodeId']}'" if event.get("nodeId") else ""
    return f"[ui-event] The user triggered '{name}'{node} with payload {payload}. Respond to it, updating the UI if appropriate."
