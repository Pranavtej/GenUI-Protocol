# genui_protocol_sdk

Python SDK for [GenUI Protocol](https://github.com/Pranavtej/GenUI-Protocol): build, validate, patch and stream AI-generated UI documents.

```python
from genui_protocol_sdk import ui, bind, tpl, actions, document, assert_valid

doc = document(
    ui.card(
        ui.input(id="name", label="Name", value=bind("form.name")),
        ui.text(content=tpl("Hello {{form.name}}")),
        ui.button(label="Send", on_click=actions.submit("signup", "form")),
        title="Sign up",
    ),
    data={"form": {"name": ""}},
)
assert_valid(doc)  # raises InvalidDocumentError listing every problem
```

- `validate_document` mirrors the TypeScript validator (limits, props, URLs, actions, expressions) and passes the shared `conformance/` fixtures.
- `apply_patches` applies RFC 6902 patches atomically; `resolve_value` resolves `$bind`/`$tpl`.
- `McpClient` talks to the MCP server's REST sidecar (`guide()` returns the system prompt and tool definitions for your LLM).
- `registry.json` is generated from the TypeScript registry: `pnpm emit:registry`.
