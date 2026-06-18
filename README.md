# GenUI Protocol

**A universal, framework-agnostic protocol for AI-generated interfaces.**

[![CI](https://img.shields.io/github/actions/workflow/status/Pranavtej/GenUI-Protocol/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Pranavtej/GenUI-Protocol/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pm-pnpm-F69220?logo=pnpm)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org)

AI agents today mostly return text. But modern AI systems have access to business metrics, analytics, workflows, and operational data — and text is rarely the best way to present it.

GenUI Protocol lets AI agents generate rich, interactive UIs by emitting a **compact AST** instead of framework-specific code. A lightweight runtime reconciles and renders that AST natively across **React, Angular, Vue, Svelte, React Native, SwiftUI, and Flutter** — all from a single protocol-compliant payload.

No code generation. No eval. Just a universal language for AI-generated interfaces.

---

## How it works

```
Your AI Agent (LangChain, Vercel AI SDK, etc.)
       │
       │  MCP Protocol — discover_components, generate_ast, validate_ast
       ▼
┌─────────────┐
│  MCP Server │  ← Component Registry, Schema Validation, AST Tools
└──────┬──────┘
       │ Compact AST Document  { t, p?, c?, id? }
       ▼
┌──────────────┐
│ Runtime Core │  ← Parse, Normalize, Diff, Reconcile, Patch
└──────┬───────┘
       │ RuntimeNode Tree
       ▼
┌──────────────────────────────┐
│ Renderers                    │
│ React  Vue  Angular  Svelte  │
│ React Native  SwiftUI  Flutter│
└──────────────────────────────┘
       │
       ▼
Interactive UI components inside your AI response
```

1. **Connect MCP** — Pass the GenUI MCP server to your AI agent (LangChain, Vercel AI SDK, CrewAI, etc.)
2. **Install a renderer** — Add `@genuiprotocol/react-renderer` (or Angular, Vue, etc.) to your frontend
3. **AI generates AST** — Your agent emits `{ t: "Card", p: {...}, c: [...] }` — no framework code
4. **Renderer builds the UI** — Pass the AST to `<GenUIRenderer ast={ast} />` and get native interactive components

---

## Features

- **AI-Native AST** — Compact format `{t, p?, c?, id?}` designed for LLM generation. Up to 67% fewer tokens than JSON-based approaches.
- **Universal Rendering** — Same AST renders natively on 7+ frameworks via thin adapter layers.
- **Streaming Patches** — Incremental updates via JSON Patch operations over SSE. Components appear as the AI generates them.
- **MCP Integration** — Model Context Protocol server for AI tool discovery, validation, and schema exposure.
- **Component Registry** — Schema-driven metadata registry that lets AI agents query and discover available components.
- **Runtime Engine** — Framework-agnostic tree diffing, reconciliation, and patch application.
- **Reactive State** — Signal-based state engine with computed values and effects.
- **Serializable Events** — Structured event routing designed for AI workflow orchestration.
- **Safe by Default** — No arbitrary code execution. Components render through a controlled, validated AST pipeline.

---

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

# Launch dev server
pnpm dev
```

### Run individual apps

```bash
# Angular playground (full-featured)
pnpm --filter playground-angular serve

# React playground (AST editor)
pnpm --filter playground dev

# MCP server (for AI agent integration)
pnpm --filter mcp-server dev
```

---

## Usage

### Generate an AST

```typescript
import { createNode } from "@ainative-ui/ast";
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

```typescript
import { validateASTDocument } from "@ainative-ui/validation";

const result = validateASTDocument(ast);
if (result.valid) {
  console.log("AST is valid");
} else {
  console.error("Validation errors:", result.errors);
}
```

### Use the Python SDK

```python
from ai_native_ui_sdk import create_node, create_dashboard_ast

dashboard = create_dashboard_ast(
    title="Revenue Overview",
    kpis=[("Revenue", "$124K"), ("Users", "12,847")],
    chart_type="line",
)
```

---

## Project Structure

```
genui-protocol/
├── apps/
│   ├── mcp-server/           # MCP-compliant server for AI tool discovery
│   ├── playground/           # AST editor & live preview (React)
│   ├── playground-angular/   # AST editor & canvas (Angular)
│   ├── test-app/             # SSE streaming test harness (Angular)
│   ├── registry-ui/          # Component registry browser (React)
│   └── docs/                 # Documentation site
│
├── packages/
│   ├── core/                 # Foundation types & protocols
│   │   ├── ast/              # Universal AST definitions
│   │   ├── protocol/         # Protocol versioning & contracts
│   │   └── schemas/          # JSON Schema definitions
│   │
│   ├── runtime/              # Core runtime engines
│   │   ├── runtime-core/     # Tree reconciliation, diffing, patching
│   │   ├── state-engine/     # Signal-based reactive state
│   │   ├── event-engine/     # Serializable event routing
│   │   ├── stream-engine/    # Incremental patch streaming (SSE)
│   │   └── validation/       # AST & schema validation (Zod, AJV)
│   │
│   ├── components/           # Component definitions & builders
│   │   ├── component-registry/ # Metadata registry for AI discovery
│   │   ├── core/             # Core component builders
│   │   ├── charts/           # Chart component builders
│   │   ├── data/             # Data component builders (Table, KPI)
│   │   ├── forms/            # Form component builders
│   │   └── workflows/        # Workflow & dashboard builders
│   │
│   ├── renderers/            # Framework-specific renderers
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
│   │   ├── js/               # TypeScript SDK
│   │   └── python/           # Python SDK
│   │
│   └── tooling/              # Utilities & testing
│       ├── testing/          # Test suite utilities
│       └── theme-engine/     # Theme token engine
│
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml       # Workspace configuration
├── tsconfig.base.json        # Shared TypeScript config
└── package.json              # Root manifest
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@ainative-ui/ast` | Universal AST node types and helpers |
| `@ainative-ui/protocol` | Protocol versioning and contract types |
| `@ainative-ui/schemas` | JSON Schema definitions for components |
| `@ainative-ui/runtime-core` | Framework-agnostic runtime engine |
| `@ainative-ui/state-engine` | Signal-based reactive state management |
| `@ainative-ui/event-engine` | Serializable event routing for AI workflows |
| `@ainative-ui/stream-engine` | Incremental patch streaming via SSE |
| `@ainative-ui/validation` | AST and schema validation (Zod + AJV) |
| `@ainative-ui/component-registry` | Schema-driven component metadata registry |
| `@ainative-ui/components-core` | Core component AST builders |
| `@ainative-ui/components-charts` | Chart component AST builders |
| `@ainative-ui/components-data` | Data component AST builders (Table, KPI) |
| `@ainative-ui/components-forms` | Form component AST builders |
| `@ainative-ui/components-workflows` | Workflow and dashboard AST builders |
| `@ainative-ui/renderer-react` | React renderer adapter |
| `@ainative-ui/renderer-vue` | Vue renderer adapter |
| `@ainative-ui/renderer-svelte` | Svelte renderer adapter |
| `@ainative-ui/renderer-angular` | Angular renderer adapter |
| `@ainative-ui/renderer-react-native` | React Native renderer adapter |
| `@ainative-ui/renderer-swiftui` | SwiftUI renderer adapter |
| `@ainative-ui/renderer-flutter` | Flutter renderer adapter |
| `@ainative-ui/renderer-angular-ui` | Headless Angular UI component library |
| `@ainative-ui/sdk-js` | JavaScript/TypeScript developer SDK |
| `@ainative-ui/testing` | Test suite and smoke test utilities |
| `@ainative-ui/theme-engine` | Theme token engine (light/dark) |

---

## Architecture

The GenUI Protocol is built in layers:

**AI Layer** — AI agents use MCP tools to discover available components, understand schemas, compose valid UI structures, and generate optimized AST payloads.

**Runtime Layer** — Framework-agnostic engines parse, validate, diff, reconcile, and patch the AST tree. State management and event routing are handled at this layer.

**Renderer Layer** — Thin adapter layers per framework that consume the runtime tree and produce native UI components. Angular is the reference implementation using standalone components and signals.

Each layer is independently versioned and swappable. The AST is the contract — everything else is implementation.

---

## Vision

Today, AI assistants mostly return text. But AI systems already have access to business metrics, analytics, workflows, and operational data.

GenUI Protocol's goal is to give AI a **universal language for creating interfaces** — not to replace frontend frameworks, but to let AI describe what it wants to show, and let the framework render it natively.

**Target use cases:**
- AI copilots that generate live dashboards
- AI agent platforms with built-in UI generation
- SaaS products with AI-powered analytics
- Internal tools with dynamic, data-driven interfaces

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

For security concerns, see [SECURITY.md](SECURITY.md) or email security@genui-protocol.dev.

## License

MIT — see [LICENSE](LICENSE) for details.
