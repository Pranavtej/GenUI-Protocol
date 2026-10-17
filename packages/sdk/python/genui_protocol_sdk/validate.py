"""Document validation (spec section 4). Behaviour mirrors `@genui-protocol/validation`."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from jsonschema import Draft202012Validator

from .registry import Registry, is_valid_component_type

PROTOCOL_VERSION = "1.0.0"
MAX_ACTIONS_PER_EVENT = 20
ACTION_KINDS = ["setData", "toggle", "navigate", "emit", "submit"]
URL_PROPS = {"href", "src", "url", "link", "action", "poster", "srcset"}
SAFE_URL_SCHEMES = {"http:", "https:", "mailto:", "tel:"}
NODE_KEYS = {"t", "id", "p", "c"}


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.valid


@dataclass
class Limits:
    max_depth: int = 64
    max_nodes: int = 5000
    max_string_length: int = 100_000


def is_safe_url(value: str) -> bool:
    cleaned = re.sub(r"[\x00-\x20\x7f-\x9f]", "", value)
    m = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*:)", cleaned)
    return True if not m else m.group(1).lower() in SAFE_URL_SCHEMES


def is_action_prop(name: str) -> bool:
    return bool(re.match(r"^on[A-Z]", name))


def _non_empty(v: Any) -> bool:
    return isinstance(v, str) and len(v) > 0


def validate_action(action: Any) -> list[str]:
    if not isinstance(action, dict) or not isinstance(action.get("do"), str):
        return ['Action must be an object with a "do" field']
    allowed = {
        "setData": ["do", "path", "value"], "toggle": ["do", "path"], "navigate": ["do", "to"],
        "emit": ["do", "name", "payload"], "submit": ["do", "name", "from"],
    }
    kind = action["do"]
    if kind not in allowed:
        return [f'Unknown action "{kind}"']
    errors = [f'Action "{kind}" has unknown field "{k}"' for k in action if k not in allowed[kind]]
    if kind == "setData":
        if not _non_empty(action.get("path")):
            errors.append('setData requires a non-empty "path"')
        if "value" not in action:
            errors.append('setData requires "value"')
    elif kind == "toggle":
        if not _non_empty(action.get("path")):
            errors.append('toggle requires a non-empty "path"')
    elif kind == "navigate":
        if not _non_empty(action.get("to")):
            errors.append('navigate requires a non-empty "to"')
        elif not is_safe_url(action["to"]):
            errors.append("navigate uses a disallowed URL scheme")
    elif kind == "emit":
        if not _non_empty(action.get("name")):
            errors.append('emit requires a non-empty "name"')
        if action.get("payload") is not None and not isinstance(action["payload"], dict):
            errors.append('emit "payload" must be an object')
    elif kind == "submit":
        if not _non_empty(action.get("name")):
            errors.append('submit requires a non-empty "name"')
        if not _non_empty(action.get("from")):
            errors.append('submit requires a non-empty "from" (data path)')
    return errors


def _is_expression(v: Any) -> bool:
    return isinstance(v, dict) and ("$bind" in v or "$tpl" in v)


def _without_props(schema: dict[str, Any], names: list[str]) -> dict[str, Any]:
    out = dict(schema)
    if isinstance(schema.get("properties"), dict):
        out["properties"] = {k: v for k, v in schema["properties"].items() if k not in names}
    if isinstance(schema.get("required"), list):
        out["required"] = [k for k in schema["required"] if k not in names]
    return out


class Validator:
    def __init__(self, registry: Registry | None = None, limits: Limits | None = None, allowed_components: list[str] | None = None) -> None:
        self.registry = registry or Registry()
        self.limits = limits or Limits()
        self.allowed = set(allowed_components) if allowed_components is not None else None
        self._compiled: dict[tuple[str, tuple[str, ...]], Draft202012Validator] = {}

    # ---- props ------------------------------------------------------------------
    def _validator_for(self, entry: dict[str, Any], exempt: list[str]) -> Draft202012Validator:
        key = (entry["id"], tuple(sorted(exempt)))
        v = self._compiled.get(key)
        if v is None:
            schema = _without_props(entry["schema"], exempt) if exempt else entry["schema"]
            v = self._compiled[key] = Draft202012Validator(schema)
        return v

    def validate_node_props(self, node: dict[str, Any]) -> list[str]:
        entry = self.registry.get(node["t"])
        if entry is None:
            return [f'Unknown component type: "{node["t"]}"']
        props = node.get("p") or {}
        exempt = [k for k, v in props.items() if is_action_prop(k) or _is_expression(v)]
        checked = {k: v for k, v in props.items() if k not in exempt}
        validator = self._validator_for(entry, exempt)
        out = []
        for err in validator.iter_errors(checked):
            where = "/" + "/".join(str(p) for p in err.absolute_path) if err.absolute_path else ""
            out.append(f'Props validation error for component "{node["t"]}": {where} {err.message}')
        return out

    def _check_props(self, node: dict[str, Any], path: str, errors: list[str]) -> None:
        for key, value in (node.get("p") or {}).items():
            if is_action_prop(key):
                actions = value if isinstance(value, list) else ([] if value is None else [value])
                if len(actions) > MAX_ACTIONS_PER_EVENT:
                    errors.append(f'Path "{path}": prop "{key}" has more than {MAX_ACTIONS_PER_EVENT} actions')
                for i, a in enumerate(actions[:MAX_ACTIONS_PER_EVENT]):
                    errors += [f'Path "{path}": prop "{key}"[{i}]: {e}' for e in validate_action(a)]
                continue
            if _is_expression(value):
                valid_bind = isinstance(value.get("$bind"), str) and len(value["$bind"]) > 0 and all(k in ("$bind", "default") for k in value)
                valid_tpl = isinstance(value.get("$tpl"), str) and len(value) == 1
                if not valid_bind and not valid_tpl:
                    errors.append(f'Path "{path}": prop "{key}" is a malformed $bind/$tpl expression')
                elif valid_tpl and len(value["$tpl"]) > self.limits.max_string_length:
                    errors.append(f'Path "{path}": prop "{key}" template exceeds maximum string length')
                continue
            if isinstance(value, str):
                if len(value) > self.limits.max_string_length:
                    errors.append(f'Path "{path}": prop "{key}" exceeds maximum string length of {self.limits.max_string_length}')
                elif key.lower() in URL_PROPS and not is_safe_url(value):
                    errors.append(f'Path "{path}": prop "{key}" uses a disallowed URL scheme')

    # ---- structure ----------------------------------------------------------------
    def _check_limits(self, root: Any) -> str | None:
        count = 0
        stack = [(root, 1)]
        while stack:
            node, depth = stack.pop()
            if not isinstance(node, dict):
                continue
            count += 1
            if count > self.limits.max_nodes:
                return f"Document exceeds maximum of {self.limits.max_nodes} nodes"
            if depth > self.limits.max_depth:
                return f"Document exceeds maximum depth of {self.limits.max_depth}"
            c = node.get("c")
            if isinstance(c, list):
                stack.extend((child, depth + 1) for child in c)
        return None

    def _check_structure(self, node: Any, path: str, errors: list[str]) -> None:
        if not isinstance(node, dict):
            errors.append(f"{path}: node must be an object")
            return
        for k in node:
            if k not in NODE_KEYS:
                errors.append(f'{path}: unknown key "{k}"')
        if not isinstance(node.get("t"), str) or not node["t"]:
            errors.append(f"{path}: Component type 't' is required")
        if "id" in node and not isinstance(node["id"], str):
            errors.append(f"{path}: id must be a string")
        if "p" in node and not isinstance(node["p"], dict):
            errors.append(f"{path}: p must be an object")
        if "c" in node:
            if not isinstance(node["c"], list):
                errors.append(f"{path}: c must be an array")
            else:
                for i, child in enumerate(node["c"]):
                    self._check_structure(child, f"{path}/c/{i}", errors)

    def validate_node(self, root: Any, target_renderer: str | None = None) -> ValidationResult:
        if not isinstance(root, dict):
            return ValidationResult(False, ["Node must be an object"])
        limit_error = self._check_limits(root)
        if limit_error:
            return ValidationResult(False, [limit_error])
        errors: list[str] = []
        self._check_structure(root, "", errors)
        if errors:
            return ValidationResult(False, errors)

        seen: set[str] = set()

        def traverse(node: dict[str, Any], path: str) -> None:
            if "id" in node:
                if node["id"] in seen:
                    errors.append(f'Path "{path}": duplicate node id "{node["id"]}"')
                seen.add(node["id"])
            if not is_valid_component_type(node["t"]):
                errors.append(f'Path "{path}": invalid component type "{node["t"]}" (use camelCase, or "vendor:name" for custom components)')
            if self.allowed is not None and node["t"] not in self.allowed:
                errors.append(f'Path "{path}": Component "{node["t"]}" is not allowed')
            errors.extend(f'Path "{path}": {e}' for e in self.validate_node_props(node))
            self._check_props(node, path, errors)
            if target_renderer:
                entry = self.registry.get(node["t"])
                if entry and entry.get("renderers") is not None and target_renderer not in entry["renderers"]:
                    errors.append(f'Path "{path}": Component "{node["t"]}" is not supported by renderer "{target_renderer}"')
            for i, child in enumerate(node.get("c") or []):
                traverse(child, f"{path}/c/{i}")

        traverse(root, "/root")
        return ValidationResult(not errors, errors)

    def validate_document(self, doc: Any, target_renderer: str | None = None) -> ValidationResult:
        if not isinstance(doc, dict) or not isinstance(doc.get("version"), str) or "root" not in doc:
            return ValidationResult(False, ['Document must be an object with "version" (string) and "root" (node)'])
        version = doc["version"]
        if not re.match(r"^\d+\.\d+\.\d+", version):
            return ValidationResult(False, [f'Invalid version "{version}": expected semver'])
        if version.split(".")[0] != PROTOCOL_VERSION.split(".")[0]:
            return ValidationResult(False, [f'Unsupported protocol version "{version}": this validator supports {PROTOCOL_VERSION.split(".")[0]}.x'])
        if "data" in doc and not isinstance(doc["data"], dict):
            return ValidationResult(False, ['"data" must be an object'])
        return self.validate_node(doc["root"], target_renderer)


_default: Validator | None = None


def _validator() -> Validator:
    global _default
    if _default is None:
        _default = Validator()
    return _default


def validate_document(doc: Any, target_renderer: str | None = None) -> ValidationResult:
    return _validator().validate_document(doc, target_renderer)


def validate_node(root: Any, target_renderer: str | None = None) -> ValidationResult:
    return _validator().validate_node(root, target_renderer)
