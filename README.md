# GenUI Protocol

**A universal, framework-agnostic protocol for AI-generated interfaces.**

[![CI](https://img.shields.io/github/actions/workflow/status/Pranavtej/GenUI-Protocol/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Pranavtej/GenUI-Protocol/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pm-pnpm-F69220?logo=pnpm)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org)

GenUI Protocol makes AI-generated interface output framework-agnostic by using a compact AST payload instead of generated UI code. It enables a single AI response to render as native UI in React, Angular, Vue, Svelte, React Native, SwiftUI, and Flutter.

- No code generation
- No runtime eval
- One AST format across platforms

---

## Overview

AI agents often return text, but modern applications need interactive dashboards, workflows, and data-driven UIs.

GenUI Protocol solves this by:

- exposing component metadata through a Model Context Protocol (MCP) server
- generating a compact AST document like `{ t, p?, c?, id? }`
- validating and reconciling the AST in a runtime engine
- rendering that AST with lightweight adapters for multiple frameworks

This keeps the interface declarative, portable, and safe.

---

## Key Features

- **Compact AST format** optimized for LLM-driven UI generation
- **Multi-framework rendering** with shared AST semantics
- **MCP-driven component discovery** and schema validation
- **Runtime validation** with Zod and AJV
- **Incremental updates** via SSE and JSON Patch
- **Reactive state management** and structured event routing
- **Safe execution** without arbitrary code injection

---

## Getting Started

### Requirements

- Node.js >= 18
- pnpm >= 8

### Install

```bash
pnpm install
pnpm build
```

### Start development

```bash
pnpm dev
```

### Run individual apps

```bash
pnpm --filter playground dev
pnpm --filter playground-angular serve
pnpm --filter mcp-server dev
```

---

## Example

### A document with data, bindings and actions

```json
{
  "version": "1.0.0",
  "data": { "form": { "name": "" } },
  "root": {
    "t": "card",
    "p": { "title": "Sign up" },
    "c": [
      { "t": "input", "p": { "label": "Name", "value": { "$bind": "form.name" } } },
      { "t": "text", "p": { "content": { "$tpl": "Hello {{form.name}}" } } },
      { "t": "button", "p": { "label": "Send", "onClick": { "do": "submit", "name": "signup", "from": "form" } } }
    ]
  }
}
```

No code: `$bind`/`$tpl` are data lookups and `onClick` holds a declarative action (see [`spec/SPEC.md`](spec/SPEC.md) §10–11).

### Render it in React

```tsx
import { GenUiRenderer, createSession } from "@genui-protocol/renderer-react";

const session = createSession({
  document,
  onEmit: (event) => agent.send(event), // submit/emit actions come back to your agent here
});

<GenUiRenderer session={session} theme="light" />;
```

Stream updates into the same session:

```ts
import { StreamConsumer, connectSSE } from "@genui-protocol/stream-engine";

const consumer = new StreamConsumer({
  apply: (frame) => session.applyFrame(frame),
  onResync: () => reconnectAndRequestSnapshot(),
});
connectSSE("/api/stream", (frame) => consumer.push(frame));
```

### Validate

```ts
import { validateDocument, createValidator } from "@genui-protocol/validation";

const result = validateDocument(document); // { valid, errors? }

// untrusted producers: restrict components and tighten limits
const strict = createValidator({ allowedComponents: ["page", "card", "text", "kpi"], limits: { maxNodes: 500 } });
```

### Diff and patch

```ts
import { buildRuntimeTree, diffRuntimeTree, applyTreePatches } from "@genui-protocol/runtime-core";

const patches = diffRuntimeTree(buildRuntimeTree(before), buildRuntimeTree(after)); // RFC 6902
const next = applyTreePatches(buildRuntimeTree(before), patches);
```

### Python

```python
from genui_protocol_sdk import ui, bind, actions, document, assert_valid

doc = document(ui.card(ui.input(label="Name", value=bind("form.name")),
                       ui.button(label="Send", on_click=actions.submit("signup", "form")), title="Sign up"),
               data={"form": {"name": ""}})
assert_valid(doc)
```

### CLI, MCP server and evals

```bash
genui validate doc.json        # exit 1 + readable errors when invalid
genui diff before.json after.json
genui scaffold form > form.json
genui prompt                   # the LLM system prompt, generated from the registry
genui-eval --mock              # how reliably does a model emit valid documents? (--provider anthropic|openai for real runs)
```

The MCP server (`apps/mcp-server`, see its README) serves the same protocol guide to agents via `get_protocol_guide`.

---

## Project Structure

```
/ (root)
├── apps/
│   ├── docs/
│   ├── mcp-server/
│   ├── playground/
│   ├── playground-angular/
│   ├── registry-ui/
│   └── test-app/
├── packages/
│   ├── components/
│   ├── core/
│   ├── renderers/
│   ├── runtime/
│   ├── sdk/
│   └── tooling/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Core Packages

- `@genui-protocol/ast` — AST node types and helper utilities
- `@genui-protocol/protocol` — protocol contracts and versioning
- `@genui-protocol/schemas` — JSON schema definitions
- `@genui-protocol/runtime-core` — runtime tree, id-keyed diff, RFC 6902 patches, data store, actions, `RuntimeSession`
- `@genui-protocol/state-engine` — signal-based reactivity
- `@genui-protocol/event-engine` — event routing for AST interactions
- `@genui-protocol/stream-engine` — ordered stream consumer (resync), SSE client
- `@genui-protocol/validation` — AST validation pipeline
- `@genui-protocol/component-registry` — discoverable component metadata
- `@genui-protocol/renderer-react` — React renderer (all built-in components, bindings, actions, themes)
- `@genui-protocol/angular` — Angular renderer (reference implementation)
- `@genui-protocol/theme-engine` — design tokens → CSS variables
- `@genui-protocol/sdk-js` — JavaScript/TypeScript SDK
- `genui_protocol_sdk` — Python SDK (minimal)

---

## Architecture

1. **AI Layer** — discover components and generate a validated AST
2. **Runtime Layer** — normalize, diff, reconcile, and patch AST trees
3. **Renderer Layer** — render native UI in the target framework

The AST is the core contract, while renderers remain small adapters.

---

## Why Use GenUI Protocol?

- Keeps AI UI output declarative and framework-independent
- Supports web and native UI platforms from a single AST
- Enables incremental updates and interactive workflows
- Avoids unsafe code generation and runtime execution

---

## Contributing

Contributions are welcome.

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- Open issues for bugs or feature requests
- Keep pull requests focused and tested

---

## License

MIT — see `LICENSE` for details.
