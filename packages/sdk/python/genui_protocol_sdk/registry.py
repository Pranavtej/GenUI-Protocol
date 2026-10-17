"""Component registry loaded from the bundled `registry.json` (generated from the TypeScript registry)."""

from __future__ import annotations

import json
import re
from importlib import resources
from typing import Any

COMPONENT_TYPE_PATTERN = re.compile(r"^[a-z][A-Za-z0-9]*(:[A-Za-z][A-Za-z0-9_-]*)?$")


def is_valid_component_type(t: str) -> bool:
    return len(t) <= 64 and bool(COMPONENT_TYPE_PATTERN.match(t))


class Registry:
    def __init__(self, entries: list[dict[str, Any]] | None = None) -> None:
        if entries is None:
            entries = json.loads(resources.files("genui_protocol_sdk").joinpath("registry.json").read_text("utf-8"))
        self._entries: dict[str, dict[str, Any]] = {e["id"]: e for e in entries}

    def list(self) -> list[dict[str, Any]]:
        return list(self._entries.values())

    def get(self, name: str) -> dict[str, Any] | None:
        return self._entries.get(name)

    def register_custom(self, id: str, schema: dict[str, Any], renderers: list[str] | None = None, category: str = "general") -> dict[str, Any]:
        """Registers a namespaced (`vendor:name`) component; built-ins can never be shadowed."""
        if not is_valid_component_type(id) or ":" not in id:
            raise ValueError(f'Custom component id "{id}" must be namespaced like "vendor:name"')
        if id in self._entries:
            raise ValueError(f'Component "{id}" is already registered')
        entry = {"id": id, "name": id, "version": "1.0.0", "category": category, "renderers": renderers or [], "schema": schema}
        self._entries[id] = entry
        return entry
