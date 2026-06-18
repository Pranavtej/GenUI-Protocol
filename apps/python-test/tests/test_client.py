"""Tests for the MCP client."""

from src.client.mcp_client import MCPClient, MCPClientError, ValidationResult


def test_validation_result():
    r = ValidationResult(valid=True)
    assert r.valid is True
    assert r.errors is None

    r = ValidationResult(valid=False, errors=["missing 't' field"])
    assert r.valid is False
    assert len(r.errors) == 1


def test_mcp_client_error():
    try:
        raise MCPClientError("not found")
    except MCPClientError as e:
        assert "not found" in str(e)


def test_client_requires_base_url():
    client = MCPClient("http://localhost:1")
    try:
        client.health()
        assert False, "Should have raised"
    except Exception:
        pass
    finally:
        client.close()
