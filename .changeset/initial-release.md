---
"@genui-protocol/component-registry": minor
"@genui-protocol/ast": minor
"@genui-protocol/protocol": minor
"@genui-protocol/schemas": minor
"@genui-protocol/angular": minor
"@genui-protocol/renderer-react": minor
"@genui-protocol/event-engine": minor
"@genui-protocol/runtime-core": minor
"@genui-protocol/state-engine": minor
"@genui-protocol/stream-engine": minor
"@genui-protocol/validation": minor
"@genui-protocol/sdk-js": minor
"@genui-protocol/cli": minor
"@genui-protocol/eval": minor
"@genui-protocol/prompt-kit": minor
"@genui-protocol/theme-engine": minor
---

First public release.

- Protocol v1 draft: specification, JSON Schemas and conformance fixtures.
- Runtime: id-keyed diff, RFC 6902 patches, hardened validator, data binding (`$bind`/`$tpl`), declarative actions, `RuntimeSession`, ordered streaming with resync.
- Renderers: React and Angular (all 23 built-in components), theming via CSS variables, custom namespaced components.
- Tooling: SDK, CLI (`genui`), prompt kit and eval harness (`genui-eval`).

The npm scope is `@genui-protocol/*` (previously `@ainative-ui/*`).
