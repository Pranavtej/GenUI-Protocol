# AI-Native UI Runtime Architecture

## Design principles

- **AI-first**: AI agents discover components and schemas through MCP APIs, never hardcode UI renderers.
- **Protocol oriented**: The AST is the canonical interface between AI and rendering systems.
- **Framework agnostic**: Runtime logic lives in `packages/runtime-core`, while renderers remain thin adapters.
- **Token efficient**: AST nodes are compact and serializable for low token usage.
- **Extensible**: Schemas, metadata, and renderers can evolve independently.
- **Deterministic**: Runtime reconciliation produces consistent results across renderers.

## Core layers

### Universal AST

The AST is the primary contract for AI-generated UI. It is compact and streamable.

- `t`: component type
- `p`: props
- `c`: children
- `id`: optional stable node identity

### Runtime Core

`packages/runtime-core` is responsible for:

- parsing AST into a runtime tree
- diffing and reconciliation
- materializing patches for streaming
- routing events back to AI / backend workflows
- coordinating state and render lifecycle

### Component Registry

`packages/component-registry` stores discovery metadata:

- component names
- versioned props
- supported renderers
- events
- examples

This is the primary source of truth for AI agent tooling.

### MCP Server

`apps/mcp-server` exposes tool APIs for AI agents:

- `discover_components`
- `get_component_schema`
- `validate_ast`
- `generate_ast_template`
- `list_renderers`
- `get_examples`
- `search_components`

The MCP server enables dynamic UI construction without hardcoded components.

### Schemas and Validation

`packages/schemas` maintains JSON Schema definitions and metadata generation.
`packages/validation` validates ASTs against schema rules and version compatibility.

### State and Event Engines

`packages/state-engine` provides a signal-like store for local/shared/global state.
`packages/event-engine` serializes events and routes them to configured handlers.
`packages/stream-engine` supports incremental AST updates using patch-based operations.

### Theming

`packages/theme-engine` exposes token-based themes for light/dark/custom palettes.

### Renderers

Renderers adapt runtime nodes to native view systems.

- React
- Angular
- Vue
- Svelte
- React Native
- SwiftUI
- Flutter

Renderers implement a minimal `Renderer` interface and avoid runtime business logic.

## Roadmap

### Phase 1

- Universal AST spec
- Runtime core
- React renderer
- MCP discovery

### Phase 2

- Angular, Vue, Svelte renderers
- richer component metadata
- playground with live switching

### Phase 3

- streaming updates
- realtime dashboards
- AI copilot integration

### Phase 4

- React Native, Flutter, SwiftUI renderer support
- official standardization

### Phase 5

- open governance model
- protocol standard adoption
