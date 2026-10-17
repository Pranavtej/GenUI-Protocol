"""Builders for GenUI documents. Everything is plain dicts, ready to `json.dumps`."""

from __future__ import annotations

from typing import Any

PROTOCOL_VERSION = "1.0.0"

Node = dict[str, Any]


def _camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(p.capitalize() for p in rest)


def node(t: str, props: dict[str, Any] | None = None, children: list[Node | None | bool] | None = None, id: str | None = None) -> Node:
    """Builds a node. `None` props and falsy children are dropped; empty `p`/`c` are omitted."""
    out: Node = {"t": t}
    if id:
        out["id"] = id
    clean = {k: v for k, v in (props or {}).items() if v is not None}
    if clean:
        out["p"] = clean
    kids = [c for c in (children or []) if isinstance(c, dict)]
    if kids:
        out["c"] = kids
    return out


def component(t: str, *children: Node | None | bool, id: str | None = None, **props: Any) -> Node:
    """Generic component factory. Snake-case keyword args become camelCase props (`on_click` -> `onClick`)."""
    return node(t, {_camel(k): v for k, v in props.items()}, list(children), id)


def custom(t: str, *children: Node | None | bool, id: str | None = None, **props: Any) -> Node:
    """Namespaced custom component (`vendor:name`)."""
    return component(t, *children, id=id, **props)


# ---- expressions -----------------------------------------------------------

_UNSET: Any = object()


def bind(path: str, default: Any = _UNSET) -> dict[str, Any]:
    """`{"$bind": path}`: resolves to the value at `path` in the data model."""
    return {"$bind": path} if default is _UNSET else {"$bind": path, "default": default}


def tpl(template: str) -> dict[str, str]:
    """`{"$tpl": "Hello {{user.name}}"}`"""
    return {"$tpl": template}


# ---- actions ---------------------------------------------------------------

class actions:  # noqa: N801 - used as a namespace: actions.submit(...)
    @staticmethod
    def set_data(path: str, value: Any) -> dict[str, Any]:
        return {"do": "setData", "path": path, "value": value}

    @staticmethod
    def toggle(path: str) -> dict[str, Any]:
        return {"do": "toggle", "path": path}

    @staticmethod
    def navigate(to: str) -> dict[str, Any]:
        return {"do": "navigate", "to": to}

    @staticmethod
    def emit(name: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        return {"do": "emit", "name": name, **({"payload": payload} if payload else {})}

    @staticmethod
    def submit(name: str, from_: str) -> dict[str, Any]:
        return {"do": "submit", "name": name, "from": from_}


# ---- components ------------------------------------------------------------

BUILTIN_COMPONENTS = [
    "page", "section", "card", "grid", "flex", "stack", "dashboard", "text", "heading", "button", "input", "textarea",
    "select", "checkbox", "table", "chart", "kpi", "tabs", "dialog", "drawer", "workflow", "timeline", "executionGraph",
]


class _UI:
    """`ui.page(ui.kpi(label="Users", value=bind("users")), title="Overview")`"""

    def __getattr__(self, name: str) -> Any:
        t = _camel(name)
        if t not in BUILTIN_COMPONENTS:
            raise AttributeError(f'"{name}" is not a built-in component (use custom("vendor:name", ...) for custom ones)')

        def factory(*children: Node | None | bool, id: str | None = None, **props: Any) -> Node:
            return component(t, *children, id=id, **props)

        factory.__name__ = name
        return factory

    def __dir__(self) -> list[str]:
        return BUILTIN_COMPONENTS


ui = _UI()


def document(root: Node, data: dict[str, Any] | None = None) -> dict[str, Any]:
    """Builds a document. `data` is the initial data model referenced by `bind` / `tpl`."""
    doc: dict[str, Any] = {"version": PROTOCOL_VERSION, "root": root}
    if data is not None:
        doc = {"version": PROTOCOL_VERSION, "data": data, "root": root}
    return doc
