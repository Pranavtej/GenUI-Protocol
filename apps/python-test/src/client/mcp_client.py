"""HTTP client for the GenUI Protocol MCP server."""

from dataclasses import dataclass, field
from typing import Any
import httpx


@dataclass
class ComponentEntry:
    id: str
    name: str
    category: str
    description: str | None = None
    schema_: dict[str, Any] | None = field(default=None, repr=False)
    examples: list[dict[str, Any]] | None = field(default=None, repr=False)
    events: list[str] | None = None
    renderers: list[str] | None = None


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] | None = None


class MCPClientError(Exception):
    pass


class MCPClient:
    """Client for the GenUI Protocol MCP HTTP API."""

    def __init__(self, base_url: str = "http://localhost:4000", timeout: float = 30.0) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "MCPClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    # ---- Health ------------------------------------------------------------

    def health(self) -> dict[str, Any]:
        r = self._client.get("/api/health")
        r.raise_for_status()
        return r.json()

    def health_ready(self) -> dict[str, Any]:
        r = self._client.get("/api/health/ready")
        r.raise_for_status()
        return r.json()

    # ---- Discovery ---------------------------------------------------------

    def discover_components(self) -> list[dict[str, Any]]:
        r = self._client.get("/api/discover_components")
        r.raise_for_status()
        return r.json()

    def get_component(self, name: str) -> dict[str, Any]:
        r = self._client.get("/api/get_component", params={"name": name})
        if r.status_code == 404:
            raise MCPClientError(r.json().get("message", f"Component '{name}' not found"))
        r.raise_for_status()
        return r.json()

    def search_components(self, query: str) -> list[dict[str, Any]]:
        r = self._client.get("/api/search_components", params={"q": query})
        r.raise_for_status()
        return r.json()

    def suggest_components(self, description: str) -> list[dict[str, Any]]:
        r = self._client.post("/api/suggest_components", json={"description": description})
        r.raise_for_status()
        data = r.json()
        return data.get("suggestions", [])

    def list_renderers(self) -> list[str]:
        r = self._client.get("/api/list_renderers")
        r.raise_for_status()
        return r.json()

    # ---- AST Generation ----------------------------------------------------

    def generate_ast(self, root: dict[str, Any]) -> dict[str, Any]:
        r = self._client.post("/api/generate_ast", json={"root": root})
        r.raise_for_status()
        return r.json()

    def generate_template(self, template_type: str = "dashboard") -> dict[str, Any]:
        r = self._client.get("/api/generate_template", params={"type": template_type})
        r.raise_for_status()
        return r.json()

    # ---- Validation --------------------------------------------------------

    def validate_ast(self, root: dict[str, Any], renderer: str | None = None) -> ValidationResult:
        body: dict[str, Any] = {"root": root}
        if renderer:
            body["renderer"] = renderer
        r = self._client.post("/api/validate_ast", json=body)
        r.raise_for_status()
        data = r.json()
        return ValidationResult(valid=data.get("valid", False), errors=data.get("errors"))

    def normalize_ast(self, root: dict[str, Any]) -> dict[str, Any]:
        r = self._client.post("/api/normalize_ast", json={"root": root})
        r.raise_for_status()
        return r.json()

    # ---- Analysis ----------------------------------------------------------

    def ast_metadata(self, root: dict[str, Any]) -> dict[str, Any]:
        r = self._client.post("/api/ast_metadata", json={"root": root})
        r.raise_for_status()
        return r.json()

    # ---- SSE Streaming (for real-time use) ---------------------------------

    def stream_events(self) -> httpx.Response:
        return self._client.stream("GET", "/api/stream")

    def stream_patch(self, patches: list[dict[str, Any]]) -> dict[str, Any]:
        r = self._client.post("/api/stream_patch", json={"patches": patches})
        r.raise_for_status()
        return r.json()
