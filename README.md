# AI-Native UI Runtime

A production-grade open-source monorepo for a universal framework-agnostic UI protocol optimized for AI-generated interfaces.

## What it is

- AI generates a compact Universal UI AST instead of framework-specific code.
- A runtime engine reconciles the AST, validates it, and streams updates.
- Renderer packages adapt the runtime tree to React, Angular, Vue, Svelte, React Native, SwiftUI, Flutter, and future platforms.
- MCP server exposes discovery, schema, validation, and metadata APIs for AI agents.

## Monorepo layout

- `apps/playground` — AST editor, live preview, renderer switching, schema explorer.
- `apps/docs` — documentation site built with Docusaurus.
- `apps/registry-ui` — component registry explorer.
- `apps/mcp-server` — MCP-compliant backend for AI discovery and validation.
- `packages/ast` — universal AST definitions and helpers.
- `packages/runtime-core` — framework-agnostic runtime engine, reconciliation, diffing.
- `packages/component-registry` — component metadata registry for AI discovery.
- `packages/schemas` — JSON Schema definitions and metadata generation.
- `packages/validation` — AST/schema validation using Zod and JSON Schema.
- `packages/state-engine` — signal-based state management.
- `packages/event-engine` — serializable event routing for AI workflows.
- `packages/stream-engine` — incremental update stream engine with patch operations.
- `packages/theme-engine` — theme token engine for light/dark/custom palettes.
- `packages/sdk-js` — JavaScript developer SDK for AST creation, validation, streaming.
- `packages/sdk-python` — Python SDK skeleton.
- `packages/renderer-*` — renderer adapters for each target framework.
- `packages/components-*` — shared component libraries.

## Quickstart

```bash
pnpm install
pnpm build
pnpm dev
```

## Project goals

- Universal AST specification with deterministic runtime tree semantics.
- AI-first component discovery via MCP instead of hardcoded UI artifacts.
- Layered architecture separating business logic, rendering adapters, and transport.
- Extensible standard with schema-driven component metadata.

## Governance

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for architecture details and contribution guidance.
