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
import { buildRuntimeTree, reconcile } from "@ainative-ui/runtime-core";

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
import { validateASTDocument } from "@ainative-ui/validation";

const result = validateASTDocument(ast);
if (result.valid) {
  console.log("AST is valid");
} else {
  console.error("Validation errors:", result.errors);
}
```

### Python SDK example

```py
from ai_native_ui_sdk import create_dashboard_ast

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

- `@ainative-ui/ast` — AST node types and helper utilities
- `@ainative-ui/protocol` — protocol contracts and versioning
- `@ainative-ui/schemas` — JSON schema definitions
- `@ainative-ui/runtime-core` — runtime tree reconciliation and diffing
- `@ainative-ui/state-engine` — signal-based reactivity
- `@ainative-ui/event-engine` — event routing for AST interactions
- `@ainative-ui/stream-engine` — SSE patch streaming
- `@ainative-ui/validation` — AST validation pipeline
- `@ainative-ui/component-registry` — discoverable component metadata
- `@ainative-ui/renderer-react` — React renderer adapter
- `@ainative-ui/sdk-js` — JavaScript/TypeScript SDK
- `@ainative-ui/sdk-python` — Python SDK

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
