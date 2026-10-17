"""JSON helpers with JSON (not Python) equality semantics."""

from __future__ import annotations

import copy
from typing import Any


def clone(value: Any) -> Any:
    return copy.deepcopy(value)


def json_equal(a: Any, b: Any) -> bool:
    """Deep equality where booleans and numbers are distinct (`True != 1`) like in JSON."""
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(json_equal(a[k], b[k]) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(json_equal(x, y) for x, y in zip(a, b))
    if isinstance(a, (dict, list)) or isinstance(b, (dict, list)):
        return False
    return a == b
