# GenUI Protocol Specification — v1.0.0 (draft)

The key words MUST, MUST NOT, SHOULD and MAY are to be interpreted as in RFC 2119.
Sections marked **(planned)** are not yet implemented; they reserve design space (see `PROJECT_REPORT.md`, Phase 2).

Machine-readable schemas: [`spec/schemas/`](./schemas). Test vectors: [`conformance/`](../conformance).

## 1. Overview

A GenUI **document** describes a user interface as a tree of **nodes**. Producers (typically AI agents) emit documents; **runtimes** validate and diff them; **renderers** turn them into native UI. Documents are pure data: they MUST NOT contain code, and implementations MUST NOT evaluate any document content.

## 2. Document

```json
{ "version": "1.0.0", "root": { "t": "page", "p": { "title": "Dashboard" }, "c": [] } }
```

- `version` — semver string. A consumer MUST reject a document whose **major** version it does not support. Minor/patch differences MUST be tolerated.
- `root` — a node.

## 3. Node

| Key | Type | Required | Meaning |
|---|---|---|---|
| `t` | string | yes | Component type. Names a registry entry. |
| `id` | string | no | Stable identity. Unique within a document. |
| `p` | object | no | Props. Shape is defined by the component's schema. |
| `c` | node[] | no | Ordered children. |

- Nodes MUST NOT contain keys other than `t`, `id`, `p`, `c`.
- An absent `p` is equivalent to `{}`; an absent or empty `c` means no children.
- **Identity.** If `id` is present it MUST be unique across the whole document. If absent, a runtime derives a deterministic id from the node's type and position. Producers SHOULD set explicit ids on nodes that may later be reordered, inserted or removed (lists, rows, steps), because positional ids shift when siblings change.
- **Unknown components.** A validator MUST report an unregistered `t` as an error. A renderer that nevertheless receives an unknown or unsupported type MUST NOT crash; it SHOULD render a visible fallback and still render the node's children.

## 4. Validation

A conforming validator MUST check, in this order:

1. **Limits** (before any recursive processing): maximum depth (default 64), maximum node count (default 5000). Limits MUST be enforced iteratively, since documents may be hostile.
2. **Structure**: the node shape in §3.
3. **Per node**: `t` is registered (and in the session allow-list, if one is configured); `p` satisfies the component's JSON Schema; no duplicate `id`.
4. **Safety**: string props longer than the configured maximum (default 100 000 chars) are rejected; props named `href`, `src`, `url`, `link`, `action`, `poster`, `srcset` MUST be relative references or use the `http`, `https`, `mailto` or `tel` scheme. Whitespace and control characters inside the scheme are ignored when checking (`java\tscript:` is `javascript:`).
5. **Renderer support** (optional): if a target renderer is named, every node type MUST be supported by it.

## 5. Patches

Incremental updates are arrays of **RFC 6902** operations (`add`, `remove`, `replace`, `move`, `copy`, `test`) over the **root node's JSON**. Paths are **RFC 6901** JSON Pointers: `/c/2/p/label` is the `label` prop of the third child of the root; `""` is the root itself. Keys containing `/` or `~` MUST be escaped as `~1` and `~0`.

- A patch array is applied **in order** and **atomically**: if any operation fails (including a failed `test`), none is applied and the input is unchanged.
- Appending a child uses index `-` (`/c/-`).
- Convenience: an `add` whose parent node lacks `p` or `c` creates it (`{}` / `[]`). Other missing path segments are errors.
- Implementations MUST reject path tokens `__proto__`, `constructor` and `prototype`.
- `move` into the operation's own source subtree MUST fail.
- **Diffing.** Producers of patches SHOULD match children by `id` and emit `move` for reorders rather than replacing nodes. Diff output is not normative — only that applying it to the old tree yields the new tree.

Wire values in patches are plain nodes (§3); runtime-only fields (e.g. parent links) MUST NOT appear.

## 6. Streaming

A stream event is `{ sequence, timestamp, patches, transport? }` (see `stream-event.json`). `sequence` is a strictly increasing integer per stream starting at 1. Consumers apply events in sequence order.

**(planned)** Snapshot/resync frames, gap detection and acknowledgements, partial-document streaming with `pending` nodes, and error frames.

## 7. Registry & components

The component registry is the source of truth for available components: name, version, category, props JSON Schema, events, examples and supported renderers. Agents discover components through the MCP server rather than hard-coding them. Custom components SHOULD use a namespaced type (`vendor:name`) **(planned)**.

## 8. Security considerations

- Documents are data. No `eval`, no script injection, no raw HTML props are defined by the protocol.
- Runtimes SHOULD apply a per-session component allow-list for untrusted producers.
- Renderers MUST treat all prop values as untrusted text (escape on output) and MUST NOT interpret them as markup unless the component explicitly defines a sanitized rich-text type.
- Apply the §4 limits to every document and every patched result.

## 9. Not yet specified (planned)

Data binding and data sources, declarative actions and the UI→agent event channel, form state/validation rules, theming tokens, accessibility requirements per component, capability negotiation between agent and renderer.
