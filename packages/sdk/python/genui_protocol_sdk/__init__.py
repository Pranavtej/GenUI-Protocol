"""GenUI Protocol Python SDK: build, validate, patch and stream GenUI documents."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .bindings import MISSING, interpolate, make_lookup, resolve_value
from .builders import PROTOCOL_VERSION, actions, bind, component, custom, document, node, tpl, ui
from .client import McpClient, McpHttpError
from .patch import PatchError, apply_json_patch, apply_patches
from .registry import Registry
from .validate import Limits, ValidationResult, Validator, validate_document, validate_node

__all__ = [
    "PROTOCOL_VERSION", "ui", "node", "component", "custom", "bind", "tpl", "actions", "document",
    "validate_document", "validate_node", "Validator", "ValidationResult", "Limits", "Registry",
    "apply_patches", "apply_json_patch", "PatchError",
    "resolve_value", "make_lookup", "interpolate", "MISSING",
    "McpClient", "McpHttpError", "assert_valid", "InvalidDocumentError",
    "UINode", "create_node", "create_dashboard_ast",
]


class InvalidDocumentError(ValueError):
    def __init__(self, errors: list[str]) -> None:
        super().__init__("Invalid GenUI document:\n- " + "\n- ".join(errors))
        self.errors = errors


def assert_valid(doc: Any, renderer: str | None = None) -> Any:
    """Returns `doc` if valid, otherwise raises `InvalidDocumentError` listing every problem."""
    result = validate_document(doc, renderer)
    if not result.valid:
        raise InvalidDocumentError(result.errors)
    return doc


# ---- legacy API (kept for compatibility) -----------------------------------

@dataclass
class UINode:
    t: str
    p: Optional[Dict[str, Any]] = None
    c: Optional[List["UINode"]] = None
    id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {"t": self.t}
        if self.id:
            out["id"] = self.id
        if self.p:
            out["p"] = self.p
        if self.c:
            out["c"] = [child.to_dict() for child in self.c]
        return out


def create_node(t: str, p: Optional[Dict[str, Any]] = None, c: Optional[List[UINode]] = None, id: Optional[str] = None) -> UINode:
    return UINode(t=t, p=p, c=c, id=id)


def create_dashboard_ast(title: str, value: str) -> Dict[str, Any]:
    """Deprecated: use ``document(ui.dashboard(ui.kpi(...), title=...))``."""
    root = ui.dashboard(ui.kpi(label=title, value=value), title=title)
    return document(root)
