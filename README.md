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

### Build an AST

```ts
import { buildRuntimeTree, reconcile } from "@genui-protocol/runtime-core";

const ast = {
  t: "page",
  p: { title: "Dashboard" },
  children: [
    {
      t: "card",
      p: { title: "Metrics" },
      children: [
        { t: "kpi", p: { label: "Users", value: "12,847" } },
        { t: "kpi", p: { label: "Revenue", value: "$94,201" } },
      ],
    },
  ],
};

const tree = buildRuntimeTree(ast);
const patches = reconcile(previousTree, tree);
```

### Validate an AST

```ts
import { validateASTDocument } from "@genui-protocol/validation";

const result = validateASTDocument(ast);
if (result.valid) {
  console.log("AST is valid");
} else {
  console.error("Validation errors:", result.errors);
}
```

### Python SDK example

```py
from genui_protocol_sdk import create_dashboard_ast

dashboard = create_dashboard_ast(
    title="Revenue Overview",
    kpis=[("Revenue", "$124K"), ("Users", "12,847")],
    chart_type="line",
)
```

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
- `@genui-protocol/runtime-core` — runtime tree reconciliation and diffing
- `@genui-protocol/state-engine` — signal-based reactivity
- `@genui-protocol/event-engine` — event routing for AST interactions
- `@genui-protocol/stream-engine` — SSE patch streaming
- `@genui-protocol/validation` — AST validation pipeline
- `@genui-protocol/component-registry` — discoverable component metadata
- `@genui-protocol/renderer-react` — React renderer adapter
- `@genui-protocol/sdk-js` — JavaScript/TypeScript SDK
- `@genui-protocol/sdk-python` — Python SDK

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

- Read `CONTRIBUTING.md`
- Follow `CODE_OF_CONDUCT.md`
- Open issues for bugs or feature requests
- Keep pull requests focused and tested

---

## License

MIT — see `LICENSE` for details.
