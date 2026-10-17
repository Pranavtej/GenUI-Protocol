"""RFC 6902 patches over node JSON (spec section 5). Port of the TypeScript runtime."""

from __future__ import annotations

import re
from typing import Any

from ._json import clone, json_equal

_FORBIDDEN = {"__proto__", "constructor", "prototype"}
_INDEX = re.compile(r"^(0|[1-9]\d*)$")


class PatchError(Exception):
    """Raised when a patch cannot be applied. The input is never modified."""


def parse_pointer(pointer: str) -> list[str]:
    if pointer in ("", "/"):
        return []
    if not pointer.startswith("/"):
        raise PatchError(f'Invalid JSON Pointer "{pointer}": must be empty or start with "/"')
    return [t.replace("~1", "/").replace("~0", "~") for t in pointer[1:].split("/")]


def escape_token(token: str) -> str:
    return token.replace("~", "~0").replace("/", "~1")


def _index(token: str, length: int, allow_end: bool) -> int:
    if allow_end and token == "-":
        return length
    if not _INDEX.match(token):
        raise PatchError(f'Invalid array index "{token}"')
    i = int(token)
    if i > length or (not allow_end and i == length):
        raise PatchError(f"Array index {i} out of bounds (length {length})")
    return i


class _Doc:
    def __init__(self, root: Any) -> None:
        self.root = root


def _parent(doc: _Doc, tokens: list[str], op: str, lenient: bool) -> Any:
    current = doc.root
    for token in tokens[:-1]:
        if token in _FORBIDDEN:
            raise PatchError(f'Forbidden path token "{token}"')
        if isinstance(current, list):
            current = current[_index(token, len(current), False)]
        elif isinstance(current, dict):
            if lenient and op == "add" and token not in current and token in ("p", "c"):
                current[token] = {} if token == "p" else []
            if token not in current:
                raise PatchError(f'Path segment "{token}" does not exist')
            current = current[token]
        else:
            raise PatchError(f'Cannot traverse into primitive at "{token}"')
    if not isinstance(current, (dict, list)):
        raise PatchError("Parent of target is not a container")
    return current


def _get(doc: _Doc, tokens: list[str], lenient: bool) -> Any:
    if not tokens:
        return doc.root
    parent = _parent(doc, tokens, "get", lenient)
    last = tokens[-1]
    if isinstance(parent, list):
        return parent[_index(last, len(parent), False)]
    if last not in parent:
        raise PatchError(f'Path segment "{last}" does not exist')
    return parent[last]


def _add(doc: _Doc, tokens: list[str], value: Any, lenient: bool) -> None:
    if not tokens:
        doc.root = value
        return
    parent = _parent(doc, tokens, "add", lenient)
    last = tokens[-1]
    if last in _FORBIDDEN:
        raise PatchError(f'Forbidden path token "{last}"')
    if isinstance(parent, list):
        parent.insert(_index(last, len(parent), True), value)
    else:
        parent[last] = value


def _remove(doc: _Doc, tokens: list[str], lenient: bool) -> Any:
    if not tokens:
        raise PatchError("Cannot remove the document root")
    parent = _parent(doc, tokens, "remove", lenient)
    last = tokens[-1]
    if isinstance(parent, list):
        return parent.pop(_index(last, len(parent), False))
    if last not in parent:
        raise PatchError(f'Path segment "{last}" does not exist')
    return parent.pop(last)


def _apply_one(doc: _Doc, patch: dict[str, Any], lenient: bool) -> None:
    op = patch.get("op")
    tokens = parse_pointer(patch.get("path", ""))
    if op == "add":
        _add(doc, tokens, clone(patch.get("value")), lenient)
    elif op == "remove":
        _remove(doc, tokens, lenient)
    elif op == "replace":
        if not tokens:
            doc.root = clone(patch.get("value"))
            return
        parent = _parent(doc, tokens, "replace", lenient)
        last = tokens[-1]
        if isinstance(parent, list):
            parent[_index(last, len(parent), False)] = clone(patch.get("value"))
        elif last in parent and last not in _FORBIDDEN:
            parent[last] = clone(patch.get("value"))
        else:
            raise PatchError(f'Path segment "{last}" does not exist')
    elif op == "move":
        if "from" not in patch:
            raise PatchError('"move" requires "from"')
        source = parse_pointer(patch["from"])
        if len(tokens) > len(source) and tokens[: len(source)] == source:
            raise PatchError('"move" target cannot be inside its source')
        _add(doc, tokens, _remove(doc, source, lenient), lenient)
    elif op == "copy":
        if "from" not in patch:
            raise PatchError('"copy" requires "from"')
        _add(doc, tokens, clone(_get(doc, parse_pointer(patch["from"]), lenient)), lenient)
    elif op == "test":
        if not json_equal(_get(doc, tokens, lenient), patch.get("value")):
            raise PatchError(f'"test" failed at "{patch.get("path")}"')
    else:
        raise PatchError(f'Unknown patch op "{op}"')


def apply_json_patch(value: Any, patches: list[dict[str, Any]], *, lenient: bool = False) -> Any:
    """Applies patches atomically to any JSON value and returns the result (the input is untouched)."""
    doc = _Doc(clone(value))
    for patch in patches:
        _apply_one(doc, patch, lenient)
    return doc.root


def apply_patches(root: dict[str, Any], patches: list[dict[str, Any]]) -> dict[str, Any]:
    """Applies node patches (paths like `/c/0/p/label`). A missing `p`/`c` is created on `add`."""
    return apply_json_patch(root, patches, lenient=True)
