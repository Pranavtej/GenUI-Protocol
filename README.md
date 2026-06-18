# GenUI Protocol

**A universal, framework-agnostic UI protocol for AI-generated interfaces.**

[![CI](https://img.shields.io/github/actions/workflow/status/org/genui-protocol/ci.yml?branch=main&label=CI&logo=github)](https://github.com/org/genui-protocol/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pm-pnpm-F69220?logo=pnpm)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Angular](https://img.shields.io/badge/angular-19-DD0031?logo=angular)](https://angular.dev)

---

GenUI Protocol lets AI agents generate UIs by emitting a compact, framework-agnostic AST instead of framework-specific code. The runtime reconciles, validates, and streams updates to renderers across **React, Angular, Vue, Svelte, React Native, SwiftUI, and Flutter** — all from a single protocol-compliant payload.

---

## Features

- **AI-Native Protocol** — Lightweight AST format (`{t, p?, c?, id?}`) designed for LLM generation
- **Universal Rendering** — Render the same AST on 7+ frameworks via thin adapter layers
- **Streaming Patches** — Incremental updates via JSON Patch-style operations over SSE
- **MCP Integration** — Model Context Protocol server for AI tool discovery, validation, and schema exposure
- **Component Registry** — Schema-driven metadata for AI-powered component discovery
- **Runtime Engine** — Tree diffing, reconciliation, and patch application (framework-agnostic)
- **Reactive State** — Signal-based state engine with computed values and effects
- **Serializable Events** — Structured event routing designed for AI workflow orchestration

## Architecture

```
AI Agents / LLMs
      │
      ▼  MCP Protocol (Tool Discovery, Validation, Templates)
┌─────────────┐
│  MCP Server │  ← Component Registry, Schema Validation, AST Tools
└──────┬──────┘
       │ Compact AST Document ({t, p?, c?, id?})
       ▼
┌──────────────┐
│ Runtime Core │  ← Parse, Normalize, Diff, Reconcile, Patch
└──────┬───────┘
       │ RuntimeNode Tree
       ▼
┌──────────────────────────────┐
│ Renderers                    │
│ React  Vue  Svelte  Angular  │
│ React Native  SwiftUI  Flutter│
└──────────────────────────────┘
```

## Project Structure

```
genui-protocol/
├── apps/
│   ├── mcp-server/           # MCP-compliant server for AI tool discovery
│   ├── playground/           # AST editor & live preview (React)
│   ├── playground-angular/   # AST editor & canvas (Angular)
│   ├── test-app/             # SSE streaming test harness (Angular)
│   ├── registry-ui/          # Component registry browser (React)
│   └── docs/                 # Docusaurus documentation site
│
├── packages/
│   ├── core/                 # Foundation types & protocols
│   │   ├── ast/              # Universal AST definitions (UINode, ASTDocument)
│   │   ├── protocol/         # Protocol versioning & contract types
│   │   └── schemas/          # JSON Schema definitions for components
│   │
│   ├── runtime/              # Core runtime engines
│   │   ├── runtime-core/     # Tree reconciliation, diffing, patching
│   │   ├── state-engine/     # Signal-based reactive state management
│   │   ├── event-engine/     # Serializable event routing
│   │   ├── stream-engine/    # Incremental patch streaming (SSE)
│   │   └── validation/       # AST & schema validation (Zod, AJV)
│   │
│   ├── components/           # Component definitions & builders
│   │   ├── component-registry/ # Metadata registry for AI discovery
│   │   ├── core/             # Core component builders (Page, Card, etc.)
│   │   ├── charts/           # Chart component builders
│   │   ├── data/             # Data component builders (Table, KPI)
│   │   ├── forms/            # Form component builders (Input, Select)
│   │   └── workflows/        # Workflow & dashboard builders
│   │
│   ├── renderers/            # Framework-specific renderer adapters
│   │   ├── react/            # React renderer
│   │   ├── vue/              # Vue renderer
│   │   ├── svelte/           # Svelte renderer
│   │   ├── angular/          # Angular renderer
│   │   ├── react-native/     # React Native renderer
│   │   ├── swiftui/          # SwiftUI renderer
│   │   ├── flutter/          # Flutter renderer
│   │   └── angular-ui/       # Headless Angular UI components
│   │
│   ├── sdk/                  # Developer SDKs
│   │   ├── js/               # JavaScript/TypeScript SDK
│   │   └── python/           # Python SDK
│   │
│   └── tooling/              # Utilities & testing
│       ├── testing/          # Test suite & smoke test utilities
│       └── theme-engine/     # Theme token engine (light/dark)
│
├── turbo.json                # Turborepo pipeline configuration
├── pnpm-workspace.yaml       # Workspace configuration
├── tsconfig.base.json        # Shared TypeScript configuration
└── package.json              # Root package manifest
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Launch interactive dev server
pnpm dev
```

### Run Individual Apps

```bash
# Angular playground (full-featured)
pnpm --filter playground-angular serve

# React playground (AST editor)
pnpm --filter playground dev

# MCP server (for AI agent integration)
pnpm --filter mcp-server dev
```

## Usage

### Generate an AST

```typescript
import { createNode } from "@ainative-ui/ast";
import { buildRuntimeTree, reconcile } from "@ainative-ui/runtime-core";

const ast = {
  t: "page",
  p: { title: "Dashboard" },
  children: [
    { t: "card", p: { title: "Metrics" }, children: [
      { t: "kpi", p: { label: "Users", value: "12,847" } },
      { t: "kpi", p: { label: "Revenue", value: "$94,201" } },
    ]},
  ],
};

// Build runtime tree
const tree = buildRuntimeTree(ast);

// Reconcile with previous state
const patches = reconcile(previousTree, tree);
```

### Validate an AST

```typescript
import { validateASTDocument } from "@ainative-ui/validation";

const result = validateASTDocument(ast);
if (result.valid) {
  console.log("AST is valid");
} else {
  console.error("Validation errors:", result.errors);
}
```

## Packages

### @ainative-ui/* Packages

| Package | Description |
|---------|-------------|
| `@ainative-ui/ast` | Universal AST node types and helpers |
| `@ainative-ui/protocol` | Protocol versioning and contract types |
| `@ainative-ui/schemas` | JSON Schema definitions for components |
| `@ainative-ui/runtime-core` | Framework-agnostic runtime engine (diff, reconcile, patch) |
| `@ainative-ui/state-engine` | Signal-based reactive state management |
| `@ainative-ui/event-engine` | Serializable event routing for AI workflows |
| `@ainative-ui/stream-engine` | Incremental patch streaming via SSE |
| `@ainative-ui/validation` | AST and schema validation (Zod + AJV) |
| `@ainative-ui/component-registry` | Schema-driven component metadata registry |
| `@ainative-ui/components-core` | Core component AST builders |
| `@ainative-ui/components-charts` | Chart component AST builders |
| `@ainative-ui/components-data` | Data component AST builders |
| `@ainative-ui/components-forms` | Form component AST builders |
| `@ainative-ui/components-workflows` | Workflow and dashboard AST builders |
| `@ainative-ui/renderer-react` | React renderer adapter |
| `@ainative-ui/renderer-vue` | Vue renderer adapter |
| `@ainative-ui/renderer-svelte` | Svelte renderer adapter |
| `@ainative-ui/renderer-react-native` | React Native renderer adapter |
| `@ainative-ui/renderer-swiftui` | SwiftUI renderer adapter |
| `@ainative-ui/renderer-flutter` | Flutter renderer adapter |
| `@ainative-ui/renderer-angular` | Angular renderer adapter |
| `@ainative-ui/renderer-angular-ui` | Headless Angular UI component library |
| `@ainative-ui/sdk-js` | JavaScript/TypeScript developer SDK |
| `@ainative-ui/testing` | Test suite and smoke test utilities |
| `@ainative-ui/theme-engine` | Theme token engine |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our contribution guidelines and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

For security concerns, please see [SECURITY.md](SECURITY.md) or email security@genui-protocol.dev.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
