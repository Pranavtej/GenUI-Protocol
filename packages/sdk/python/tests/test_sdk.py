import json

import httpx
import pytest

from genui_protocol_sdk import (
    InvalidDocumentError, McpClient, McpHttpError, Registry, Validator, actions, assert_valid, bind, create_dashboard_ast,
    custom, document, tpl, ui, validate_document,
)
from genui_protocol_sdk.validate import Limits


def sample():
    return document(
        ui.page(
            ui.grid(ui.kpi(id="users", label="Users", value=bind("metrics.users")), None, False, cols=2),
            ui.chart(type="bar", data=bind("traffic")),
            ui.input(id="name", label="Name", value=bind("form.name")),
            ui.button(label="Go", on_click=[actions.set_data("busy", True), actions.submit("go", "form")]),
            title=tpl("Hello {{user}}"),
        ),
        data={"user": "Ada", "metrics": {"users": "12"}, "traffic": [{"label": "Mon", "value": 1}], "form": {"name": ""}, "busy": False},
    )


def test_builders_produce_valid_documents():
    doc = sample()
    assert validate_document(doc).valid, validate_document(doc).errors
    assert doc["root"]["c"][0]["c"] == [{"t": "kpi", "id": "users", "p": {"label": "Users", "value": {"$bind": "metrics.users"}}}]
    button = doc["root"]["c"][3]
    assert button["p"]["onClick"][1] == {"do": "submit", "name": "go", "from": "form"}  # snake_case -> camelCase
    json.dumps(doc)


def test_builder_errors_and_omissions():
    assert ui.card() == {"t": "card"}
    with pytest.raises(AttributeError):
        ui.nope  # noqa: B018


def test_validator_reports_specific_problems():
    bad = document(ui.page(ui.button(label="x", href="javascript:alert(1)", on_click={"do": "eval"}), custom("acme:x"), title="T"))
    errors = "\n".join(validate_document(bad).errors)
    assert "disallowed URL scheme" in errors
    assert 'Unknown action "eval"' in errors
    assert "Unknown component type" in errors


def test_limits_do_not_blow_the_stack():
    deep = {"t": "stack"}
    for _ in range(100_000):
        deep = {"t": "stack", "c": [deep]}
    assert "maximum depth" in Validator().validate_node(deep).errors[0]
    wide = {"t": "stack", "c": [{"t": "stack"} for _ in range(6000)]}
    assert "5000 nodes" in Validator().validate_node(wide).errors[0]
    assert "string length" in "\n".join(Validator(limits=Limits(max_string_length=5)).validate_node({"t": "text", "p": {"content": "x" * 6}}).errors)


def test_custom_components_and_allow_list():
    reg = Registry()
    reg.register_custom("acme:gauge", {"type": "object", "properties": {"value": {"type": "number"}}, "required": ["value"]})
    v = Validator(registry=reg)
    assert v.validate_node({"t": "acme:gauge", "p": {"value": 1}}).valid
    assert not v.validate_node({"t": "acme:gauge", "p": {"value": "x"}}).valid
    with pytest.raises(ValueError):
        reg.register_custom("kpi", {})
    assert not Validator(allowed_components=["page"]).validate_node({"t": "page", "p": {"title": "x"}, "c": [{"t": "text", "p": {"content": "y"}}]}).valid


def test_assert_valid():
    doc = sample()
    assert assert_valid(doc) is doc
    with pytest.raises(InvalidDocumentError) as e:
        assert_valid({"version": "1.0.0", "root": {"t": "nope"}})
    assert "Unknown component" in str(e.value)


def test_legacy_dashboard_helper_is_valid():
    assert validate_document(create_dashboard_ast("Revenue", "$124K")).valid


def test_registry_matches_typescript_registry():
    ids = {e["id"] for e in Registry().list()}
    assert {"page", "kpi", "chart", "executionGraph", "workflow"} <= ids


def mock_client(handler):
    return McpClient(client=httpx.Client(base_url="http://x", transport=httpx.MockTransport(handler)))


def test_client_requests_and_errors():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.method, request.url.path, request.url.query.decode()))
        if request.url.path == "/api/validate_document":
            return httpx.Response(200, json={"valid": True})
        return httpx.Response(401, json={"error": "unauthorized", "message": "A valid API key is required."})

    c = mock_client(handler)
    assert c.validate({"version": "1.0.0", "root": {"t": "page"}}) == {"valid": True}
    with pytest.raises(McpHttpError) as e:
        c.get_component("a b")
    assert e.value.status == 401 and "API key" in str(e.value)
    assert seen[1] == ("GET", "/api/get_component", "name=a+b")


def test_client_sse_subscribe():
    body = 'data: {"type":"snapshot","sequence":1,"document":{}}\n\ndata: not json\n\ndata: {"type":"patch","sequence":2,"patches":[]}\n\n'
    c = mock_client(lambda r: httpx.Response(200, content=body.encode(), headers={"content-type": "text/event-stream"}))
    assert [f["sequence"] for f in c.subscribe()] == [1, 2]
