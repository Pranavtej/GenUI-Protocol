"""Client for the GenUI MCP server's REST sidecar."""

from __future__ import annotations

import json
from typing import Any, Iterator

import httpx


class McpHttpError(Exception):
    def __init__(self, status: int, body: Any, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.body = body


class McpClient:
    def __init__(self, base_url: str = "http://localhost:4000", api_key: str | None = None, timeout: float = 15.0, client: httpx.Client | None = None) -> None:
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        self._client = client or httpx.Client(base_url=base_url.rstrip("/"), headers=headers, timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "McpClient":
        return self

    def __exit__(self, *exc: Any) -> None:
        self.close()

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        res = self._client.request(method, path, **kwargs)
        try:
            body = res.json()
        except ValueError:
            body = None
        if res.status_code >= 400:
            msg = (body or {}).get("message") or (body or {}).get("error") or res.reason_phrase if isinstance(body, dict) else res.reason_phrase
            raise McpHttpError(res.status_code, body, f"GenUI MCP {method} {path} failed ({res.status_code}): {msg}")
        return body

    def discover_components(self) -> list[dict[str, Any]]:
        return self._request("GET", "/api/discover_components")

    def get_component(self, name: str) -> dict[str, Any]:
        return self._request("GET", "/api/get_component", params={"name": name})

    def guide(self) -> dict[str, Any]:
        """System prompt and tool definitions to give your LLM."""
        return self._request("GET", "/api/protocol_guide")

    def validate(self, document: Any, renderer: str | None = None) -> dict[str, Any]:
        return self._request("POST", "/api/validate_document", json={"document": document, "renderer": renderer})

    def template(self, type: str) -> dict[str, Any]:
        return self._request("GET", "/api/generate_template", params={"type": type})

    def stream_document(self, document: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/api/stream_ast", json={"ast": document})

    def stream_patch(self, patches: list[dict[str, Any]], data_patches: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        return self._request("POST", "/api/stream_patch", json={"patches": patches, **({"dataPatches": data_patches} if data_patches else {})})

    def stream_data(self, patches: list[dict[str, Any]]) -> dict[str, Any]:
        return self._request("POST", "/api/stream_data", json={"patches": patches})

    def subscribe(self) -> Iterator[dict[str, Any]]:
        """Yields frames from the SSE stream (snapshot replay first). Malformed payloads are skipped."""
        with self._client.stream("GET", "/api/stream", headers={"Accept": "text/event-stream"}, timeout=None) as res:
            if res.status_code >= 400:
                raise McpHttpError(res.status_code, None, f"GenUI MCP stream failed ({res.status_code})")
            data: list[str] = []
            for line in res.iter_lines():
                if line.startswith("data:"):
                    data.append(line[5:].removeprefix(" "))
                elif line == "" and data:
                    payload, data = "\n".join(data), []
                    try:
                        frame = json.loads(payload)
                    except ValueError:
                        continue
                    if isinstance(frame, dict) and frame.get("type") in {"snapshot", "patch", "data", "error", "ast"}:
                        yield frame
