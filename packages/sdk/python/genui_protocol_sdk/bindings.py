"""`$bind` / `$tpl` resolution (spec section 10). Lookups only: no expressions, no code."""

from __future__ import annotations

import json
import re
from typing import Any, Callable

from .patch import parse_pointer

_FORBIDDEN = {"__proto__", "constructor", "prototype"}
_TPL = re.compile(r"\{\{\s*([^{}]+?)\s*\}\}")
MAX_DEPTH = 32
MAX_TEMPLATE_LENGTH = 100_000

Lookup = Callable[[str], Any]

#: Returned by lookups for absent paths, so a real JSON `null` stays distinguishable from "missing".
MISSING: Any = object()


def parse_data_path(path: str) -> list[str]:
    if path.startswith("/"):
        return parse_pointer(path)
    return [] if path == "" else path.split(".")


def get_at_path(data: Any, tokens: list[str]) -> Any:
    current = data
    for token in tokens:
        if token in _FORBIDDEN:
            return MISSING
        if isinstance(current, dict) and token in current:
            current = current[token]
        elif isinstance(current, list) and token.isdigit() and int(token) < len(current):
            current = current[int(token)]
        else:
            return MISSING
    return current


def make_lookup(data: Any, scope: dict[str, Any] | None = None) -> Lookup:
    scope = scope or {}

    def lookup(path: str) -> Any:
        tokens = parse_data_path(path)
        if tokens and tokens[0].startswith("$") and tokens[0] in scope:
            return get_at_path(scope[tokens[0]], tokens[1:])
        return get_at_path(data, tokens)

    return lookup


def is_bind(v: Any) -> bool:
    return isinstance(v, dict) and isinstance(v.get("$bind"), str) and all(k in ("$bind", "default") for k in v)


def is_template(v: Any) -> bool:
    return isinstance(v, dict) and isinstance(v.get("$tpl"), str) and len(v) == 1


def _stringify(v: Any) -> str:
    if v is None or v is MISSING:
        return ""
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (dict, list)):
        return json.dumps(v, separators=(",", ":"))
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def interpolate(template: str, lookup: Lookup) -> str:
    if len(template) > MAX_TEMPLATE_LENGTH:
        return ""
    return _TPL.sub(lambda m: _stringify(lookup(m.group(1))), template)


def resolve_value(value: Any, lookup: Lookup, depth: int = 0) -> Any:
    """Recursively resolves expressions. A missing `$bind` without a default resolves to None (absent)."""
    if depth > MAX_DEPTH:
        return None
    if is_bind(value):
        found = lookup(value["$bind"])
        return value.get("default") if found is MISSING else found
    if is_template(value):
        return interpolate(value["$tpl"], lookup)
    if isinstance(value, list):
        return [resolve_value(v, lookup, depth + 1) for v in value]
    if isinstance(value, dict):
        return {k: resolve_value(v, lookup, depth + 1) for k, v in value.items()}
    return value
