# GenUI Protocol — Repo Report, Gap Analysis & Completion Plan

_Generated from a read-through of the repo at commit `9774705` (branch `claude/sharp-planck-m14lej`)._

---

## 1. The idea

**Problem.** AI agents already hold business data (metrics, CRM, workflows, agent traces) but answer in text. Getting a dashboard or form still needs frontend developers, BI tools and manual UI work.

**Idea.** Let the AI emit a **compact, declarative UI AST** (`{ id?, t, p?, c? }`) instead of HTML or framework code. A **runtime** validates, normalizes, diffs and patches the AST, and a thin **renderer** per framework turns it into native UI. The AI never writes frontend code, and there is no `eval`.

**Positioning (from `project-base.md`).** An open standard in the family of OpenAPI, GraphQL, OpenTelemetry and MCP: "Generative UI Protocol (GUIP)". Angular is the reference implementation, and every other renderer must follow Angular's behaviour.

**Loop:**

```
AI agent ──MCP tools──► discover components → get schema → generate AST → validate
                                      │
                                      ▼
              runtime-core (normalize · diff · patch · state · events · stream)
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
                 Angular           React          Vue/Svelte/RN/Flutter/SwiftUI
```

**Strengths of the idea:** it is token-efficient, safe by construction, framework-agnostic, and the component registry doubles as the AI's tool catalogue. The market is timely: Vercel AI SDK generative UI, Google A2UI, MCP-UI, OpenAI Apps and CopilotKit AG-UI all circle this space. The differentiator would be a **neutral, versioned, multi-renderer spec** with a conformance suite. That differentiator is not built yet (see §4).

---

## 2. What exists today

| Area | Location | State |
|---|---|---|
| AST types + helpers | `packages/core/ast` | Done, tiny (32 lines) |
| Protocol types | `packages/core/protocol` | Version const, `RendererKey`, `ASTPatch` only |
| JSON schemas | `packages/core/schemas` | Small (57 lines) |
| Component registry | `packages/components/component-registry` | **Substantial** (708 lines): metadata, schemas, examples |
| Component packages | `components/{core,data,charts,forms,workflows}` | Metadata definitions (44–201 lines each) |
| Runtime core | `packages/runtime/runtime-core` | Working: normalize, diff, patch, reconcile (228 lines) |
| State / event / stream | `packages/runtime/*` | Implemented (277 / 116 / 102 lines) |
| Validation | `packages/runtime/validation` | Zod + AJV + registry props check + renderer compatibility |
| MCP server | `apps/mcp-server` | **Strong** (681 lines): 11 MCP tools, REST mirror, SSE stream, templates |
| Angular renderer | `packages/renderers/angular`, `angular-ui` | Real: ~17 components, dynamic renderer, theme provider |
| Angular apps | `apps/playground-angular`, `apps/test-app` | Present (test-app is the agent sandbox) |
| Python agent | `apps/python-test` | FlowAI RAG agent calling MCP; one test file |
| Python SDK | `packages/sdk/python` | 1 file, only `create_dashboard_ast` |
| JS SDK | `packages/sdk/js` | 22 lines |
| Docs | `apps/docs` | Mixed: Docusaurus **and** Nextra remnants, thin content |
| React renderer | `packages/renderers/react` | **Stub** — returns a plain object, not React elements |
| Vue/Svelte/RN/Flutter/SwiftUI | `packages/renderers/*` | **Stubs** (16 lines each, identical) |
| theme-engine / testing | `packages/tooling/*` | Stubs |
| Playground (React) | `apps/playground` | Shows JSON only, no rendering; has a `setState` inside `useMemo` bug |

**Overall maturity:** a solid **Angular + MCP + registry vertical slice** around a thin protocol layer. Everything else is scaffolding.

---

## 3. Findings: bugs, inconsistencies and hygiene problems

### 3.1 Correctness bugs / doc-vs-code mismatches
1. **README examples don't match the API.**
   - `reconcile(previousTree, tree)` is shown, but the real signature is `reconcile(document, currentTree?)`.
   - `validateASTDocument(ast)` takes a root `UINode` plus an optional renderer, not an `ASTDocument`.
   - The Python example imports `ai_native_ui_sdk.create_dashboard_ast(title=…, kpis=…, chart_type=…)`, which doesn't exist (the real one takes `title, value`).
   - `buildDashboardAST(title, metric, value)` ignores `metric`.
2. **Packages promised in the README/ARCHITECTURE don't exist:** `packages/theme-engine`, `packages/runtime-core` paths are wrong (they live under `packages/runtime/` and `packages/tooling/`). Components `heading`, `drawer`, `stack`, `timeline`, `executionGraph` are required by `project-base.md`. Check them against the registry.
3. **`runtime-core` weaknesses**
   - `diffRuntimeTree` diffs children **by index**, not by `id`. Reordering a list produces wrong or huge patches. This defeats the point of stable ids.
   - `normalizeNode` ids are deterministic by position, but `generateId` is dead code with a module-level counter.
   - `applyPatch` only handles `add/remove/replace`. `move/copy/test` are declared in `ASTPatch` but unimplemented, so it isn't really RFC 6902.
   - Paths mix `c`/`children` and `p`/`props`; there is no escaping (`~0`, `~1`) and no bounds or error handling (it will throw on bad paths from an LLM).
   - `applyPatch` deep-clones the whole tree **per patch** (O(n·patches)); `reconcile` applies diff patches back onto the tree it just diffed (it could return `nextTree` directly).
   - Patch value type `RuntimeNode` carries `parentId`, which leaks runtime internals into the wire format.
4. **Validation**
   - `validateASTDocument` is typed for a `UINode` but the name implies a document. `version` is never checked.
   - A module-level `ComponentRegistry` singleton means custom or plugin components can't be registered per validator.
   - A new `Ajv` is **compiled on every node** (slow). Cache compiled validators per component.
   - No limits on depth, node count or string length (a DoS vector for LLM or untrusted input). No prop sanitization (URLs such as `javascript:` in `href`/`src`, HTML in text).
5. **`PatchStreamer` hard-codes `transport: "custom"`** and uses `any` for the timer. No sequence-gap detection, resync, ack or backpressure on the client side.
6. **`apps/playground` (React)** calls `setAst` inside `useMemo` (side effect during render). It isn't a playground: it never renders the AST. The renderer dropdown is cosmetic.
7. **Naming is inconsistent:** GenUI Protocol / GUIP / AI-Native UI / `@ainative-ui/*` / `ai_native_ui_sdk` / `genui_ai_agent` / `ainative` `docs`. The repo name, package scope and product name should agree.
8. **`SECURITY.md`** points to `security@genui-protocol.dev`, a domain nobody has verified owning. `README` links `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`, which **don't exist**.

### 3.2 Repo hygiene
- **Build artifacts committed:** `*.js`, `*.d.ts`, `*.d.ts.map` across `packages/core/*`, `component-registry`, `event-engine` and `angular-ui`, plus `apps/docs/.docusaurus/**`, `*.tsbuildinfo`, `*.egg-info`. These conflict with `.gitignore` intent and will cause stale-output bugs. Remove them from git and extend `.gitignore`.
- **Two copies of the Angular UI:** `renderers/angular-ui` and `renderers/angular/src/ui` duplicate every component. Pick one.
- **Docs app is confused:** it contains Docusaurus config (`docusaurus.config.js`, `sidebars.js`, `docs/`) **and** Nextra/Next (`pages/`, `theme.config.tsx`, `next.config.mjs`). One must go.
- Root `package.json` declares `workspaces` while the repo uses pnpm (`pnpm-workspace.yaml`). `clean` uses `rimraf`, which isn't a dependency. `packageManager` is pnpm 8.14, which is old.
- **CI runs on `macos-latest`** (expensive, slow) with only build + lint. No tests, no typecheck gate, no Python job, no docs deploy verification, no caching.
- **Tests: effectively zero.** Only two Angular default spec stubs plus one Python test file. For a *protocol*, this is the biggest gap.
- No `CHANGELOG`, no versioning/release tooling (changesets), no `examples/` directory, no root `docs/spec`.
- `tools/README.md`, `local-publish.sh`, `dev.js` are undocumented.
- Spartan UI was the stated component base; confirm whether `angular-ui` actually wraps Spartan or reimplements components.

---

## 4. What's missing (the real gaps)

### A. The protocol itself (most important, because the product is a *standard*)
1. **A written specification.** Right now the "spec" is TypeScript types. Needed: a normative `SPEC.md` (RFC 2119 language) covering the node model, id rules, props typing, children rules, unknown-component behaviour, events, state binding, patch semantics, streaming framing, versioning and extension.
2. **Published JSON Schema** for `ASTDocument`, `ASTPatch`, the registry manifest and the stream event, generated from a single source and versioned (`$id` URLs).
3. **Version & compatibility policy:** semver for protocol vs registry vs renderers; capability negotiation (renderer announces which components and versions it supports; the agent adapts).
4. **Data binding / expressions.** Dashboards need data: `{ "$bind": "metrics.revenue" }`, data sources, and loading and error states. Today props are static literals, so the AI must inline all data, which hurts tokens and breaks live dashboards.
5. **Action / event contract.** `event-engine` exists, but the protocol must define declarative actions (`navigate`, `setState`, `callTool`, `submitForm`) with **no arbitrary code**, plus the return path from UI events to the agent (the "interaction" half of generative UI).
6. **Forms & state model:** two-way binding, validation rules in the AST, submit semantics.
7. **Streaming spec:** partial or incremental AST while the LLM is still generating (progressive rendering, skeleton and `pending` nodes), sequence numbers, resync/snapshot, error frames.
8. **Security model:** component allow-list per session, prop sanitization rules, URL scheme allow-list, size and depth limits, CSP guidance, threat model. The "no eval" claim should be provable.
9. **Accessibility** requirements (labels, roles, keyboard) as part of component contracts, and **i18n/theming** tokens in the protocol.
10. **Extension mechanism:** custom components via namespaced types (`acme:gauge`), registry plugins, and fallback rendering when a renderer doesn't support a type.

### B. Conformance & quality
1. **Conformance test suite**: a language-neutral fixtures set (`input AST → expected normalized tree / patches / validation errors`) that every renderer and SDK must pass. This is what makes a protocol real.
2. **Unit tests** for ast, runtime-core (diff/patch property tests, e.g. `apply(diff(a,b), a) == b`), validation, stream-engine, registry.
3. **MCP server integration tests** (tool contracts, REST parity, SSE).
4. **Renderer snapshot tests**, e2e (Playwright) on test-app, and Python agent tests with a mocked LLM.
5. **LLM eval harness:** measure how often models produce valid ASTs from prompts, token cost vs HTML, and repair rates. This yields the benchmark story for the project.

### C. Renderers & components
1. **React renderer is a stub** and React is the first non-reference target (and the playground's framework). Implement real `ReactRenderer` with component mapping, context provider, event bridge and an unknown-node fallback.
2. Vue, Svelte, React Native, Flutter and SwiftUI are empty. Flutter and SwiftUI cannot be TS packages; they need their own repos or packages and a JSON-driven interpreter. Mark them clearly as *planned*.
3. Missing components from the stated spec: `heading`, `drawer`, `stack`, `timeline`, `executionGraph` (verify). Chart rendering in Angular (`chart.component.ts` exists) needs a chosen library and data contract.
4. A `renderer` interface contract is only `render(node): unknown`. Define lifecycle, event emission, slot/children handling, theming and error boundaries.
5. **Theme engine** (38 lines) needs real design tokens (light/dark/custom) and renderer integration.

### D. Developer experience
1. **Playground that actually renders** (live JSON editor → rendered UI with renderer switcher, validation errors panel, patch-stream simulator).
2. **Registry UI** (`apps/registry-ui`) to browse components, schemas and examples. Check its completeness.
3. **SDKs:** the JS SDK should wrap validate / render / stream / MCP client; the Python SDK needs typed builders for every component, validation (via `jsonschema`), an MCP client and publishing to PyPI. Naming alignment with npm.
4. **CLI** (`npx genui validate|diff|serve|scaffold`).
5. **Examples** repo folder: dashboard, form workflow, agent monitoring (the use cases from `project.md`) wired end to end with a real LLM.
6. **LLM prompt kit:** system prompts and few-shot examples for "how to emit GenUI AST", plus a ready-made tool schema for OpenAI, Anthropic and MCP.
7. **Docs:** getting started, concepts, spec, API reference (TypeDoc), tutorials, FAQ. Several pages are 6–60 lines of placeholder content.

### E. Production & project health
- Auth and rate limiting on the MCP/REST server (currently open CORS, plain Express), config via env, structured logging, health endpoints exist (good).
- Dockerfile / deployment (there is a `vercel.json`, but the MCP server is long-lived and uses SSE; confirm the target).
- Release pipeline (changesets, npm provenance), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue and PR templates, `GOVERNANCE.md`, `CODEOWNERS`, Dependabot.
- Observability for generated UIs: log the AST, validation failures and user events (ties to the "AI agent monitoring" use case).
- Licence is MIT (good); add a contributor licence/DCO if aiming at a standard.

---

## 5. Recommendations (priority order)

1. **Freeze scope: "Angular + React + MCP" first.** Five more empty renderer packages signal ambition but dilute credibility. Move Vue/Svelte/RN/Flutter/SwiftUI to a "planned" list and remove the stub packages from the build.
2. **Write the spec and conformance fixtures before adding features.** It is what separates a standard from a component library.
3. **Fix the diff/patch engine** (id-keyed, RFC 6902-complete, tested) because everything streaming and interactive rests on it.
4. **Add data binding + actions** as the next protocol feature. Without them it only renders static snapshots.
5. **Security hardening early** (limits, allow-lists, sanitization) because "safe by design" is the headline claim.
6. **Clean the repo** (artifacts, duplicate Angular UI, docs stack, naming) so contributors can trust it.
7. **Prove it with a demo and benchmark:** Python agent → MCP → Angular *and* React rendering the same AST, with token and validity numbers.
8. **Consider interoperability** with MCP-UI / A2UI / AG-UI rather than competing: an adapter story speeds adoption.

---

## 6. Completion plan

Effort: S ≈ ≤1 day, M ≈ 2–4 days, L ≈ 1–2 weeks (single developer). Each phase ends with a demoable result.

### Phase 0 — Cleanup & foundations (≈ 1 week)
_Status: Phase 1 started — done: 1.1 (draft `spec/SPEC.md`, §9 lists what is still unspecified), 1.2 (`spec/schemas`), 1.3 (id-keyed diff, full RFC 6902, atomic apply), 1.4 (property tests), 1.5 (validator limits, caches, injectable registry, URL checks), 1.6 (`validateDocument`/`validateNode`), 1.8 (TS runners; Python runner pending); 1.7 in progress (runtime-core + validation + schemas covered). Phase 0: 0.1 done (name = GenUI Protocol, npm scope `@genui-protocol/*`, Angular prefix `genui-`/`GenUi*`); 0.6 SECURITY contact still pending. 0.3 kept Nextra, removed Docusaurus and `angular-ui`. Added a CI Python job, Dependabot and templates._
| # | Task | Size |
|---|---|---|
| 0.1 | Decide final name/scope (`@genui/*`?) and rename packages, Python module, docs titles consistently | M |
| 0.2 | `git rm` committed build artifacts (`*.js/.d.ts/.map`, `.docusaurus`, `*.tsbuildinfo`, `*.egg-info`); fix `.gitignore` | S |
| 0.3 | Remove duplicate Angular UI (keep one); decide docs stack (recommend Docusaurus *or* Nextra, delete the other) | M |
| 0.4 | Fix root `package.json` (drop `workspaces`, add `rimraf` or replace, bump pnpm), add `engines` | S |
| 0.5 | CI: ubuntu runner, pnpm cache, `typecheck`, `test`, Python job, docs build; branch protection | M |
| 0.6 | Add `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates, `CODEOWNERS`, Dependabot; fix `SECURITY.md` contact | S |
| 0.7 | Correct README/ARCHITECTURE to match real package paths and APIs | S |
| 0.8 | Remove or label stub renderers/packages as "planned" | S |

### Phase 1 — Protocol v1 spec & core hardening (≈ 2–3 weeks)
| # | Task | Size |
|---|---|---|
| 1.1 | Write `SPEC.md`: node model, ids, unknown components, patches, versioning, extension | L |
| 1.2 | Generate and publish JSON Schemas (document, patch, stream event, registry manifest) from one source | M |
| 1.3 | Rewrite `runtime-core` diff as id-keyed with move support; implement full RFC 6902 (`move/copy/test`), pointer escaping, safe errors; stop deep-cloning per patch | L |
| 1.4 | Property tests: `apply(diff(a,b),a) ≡ b`, idempotent normalize, round-trip serialization | M |
| 1.5 | Validation: cache compiled validators, injectable registry, validate `version`, depth/node/size limits, URL and prop sanitization | M |
| 1.6 | Define `ASTDocument` vs `UINode` APIs unambiguously (`validateDocument` / `validateNode`) | S |
| 1.7 | Unit test suite for ast, protocol, schemas, validation, state, event, stream, registry (target ≥80% on core) | L |
| 1.8 | Conformance fixtures (`/conformance/*.json`) + runner in TS and Python | L |

### Phase 2 — Interactivity: data, state, actions (≈ 2–3 weeks)
| # | Task | Size |
|---|---|---|
| 2.1 | Design data binding (`$bind`, data sources, loading/error states) and add to spec + schema | L |
| 2.2 | Declarative actions (`setState`, `navigate`, `callTool`, `submit`) with allow-list, no code execution | L |
| 2.3 | Wire event-engine to renderers and to an agent-callback channel (UI event → MCP/agent) | M |
| 2.4 | Form model: two-way binding, validation rules, submit payloads | M |
| 2.5 | Streaming spec: framing, sequence/resync/snapshot, partial AST and pending nodes; client-side consumer in stream-engine; SSE and WebSocket transports | L |

### Phase 3 — Renderers & components (≈ 3–4 weeks)
| # | Task | Size |
|---|---|---|
| 3.1 | Define the full `Renderer` contract (lifecycle, events, children, theming, error boundary, fallback) | M |
| 3.2 | Finish Angular reference: all spec components (`heading`, `drawer`, `stack`, `timeline`, `executionGraph`, …), chart library, signals/zoneless/SSR checks, a11y | L |
| 3.3 | Real **React renderer** (component map, provider, event bridge, fallback); make `apps/playground` render live | L |
| 3.4 | Real theme-engine with tokens (light/dark/custom) consumed by both renderers | M |
| 3.5 | Renderer conformance run: both renderers pass the shared fixtures; snapshot tests; Playwright e2e on `test-app` | L |
| 3.6 | Component extension API (namespaced custom components + per-session allow-list) | M |

### Phase 4 — Agent & developer experience (≈ 2–3 weeks)
| # | Task | Size |
|---|---|---|
| 4.1 | MCP server: auth, rate limits, env config, structured logging, Dockerfile, integration tests for every tool and REST route | L |
| 4.2 | JS SDK: typed builders, validate, MCP client, stream client; publish-ready | M |
| 4.3 | Python SDK: typed builders for all components, `jsonschema` validation, MCP client, PyPI packaging; fix README example | L |
| 4.4 | Align `apps/python-test` agent with SDK; mock-LLM tests; CI job | M |
| 4.5 | CLI: `validate`, `diff`, `serve`, `scaffold` | M |
| 4.6 | Registry UI finished (browse, search, schema viewer, live example preview) | M |
| 4.7 | LLM prompt kit + eval harness (validity %, repair rate, tokens vs HTML) across 2–3 models | L |

### Phase 5 — Docs, examples, release (≈ 2 weeks)
| # | Task | Size |
|---|---|---|
| 5.1 | Docs site: concepts, spec, getting-started, tutorials, FAQ, generated API reference, changelog | L |
| 5.2 | `examples/`: analytics dashboard, form workflow, agent-monitoring, each runnable on Angular and React | L |
| 5.3 | Changesets + npm provenance publish; PyPI publish; tag `v0.2.0` | M |
| 5.4 | Demo video/GIF + benchmark blog post; README overhaul | M |

### Phase 6 — Ecosystem & standardization (ongoing)
- Vue then Svelte renderers (via conformance suite); React Native next.
- Flutter / SwiftUI interpreters as separate repos following the spec.
- MCP-UI / A2UI / AG-UI adapters.
- `GOVERNANCE.md`, RFC process, versioned spec site, working-group outreach.
- Optional hosted registry / playground.

### Suggested first sprint (next 5 working days)
1. Phase 0.2, 0.4, 0.5, 0.6, 0.7 (repo is trustworthy and CI is meaningful).
2. 1.3 + 1.4 (diff/patch rewrite with property tests).
3. Stub-out `SPEC.md` skeleton with the node model and patch semantics.

---

## 7. Risks
- **Scope sprawl** (7 renderers, 5 platforms) with a one-person team. Mitigation: two renderers plus a conformance suite.
- **Crowded space** (A2UI, MCP-UI, AG-UI, Vercel). Mitigation: neutrality, conformance suite, interop adapters.
- **LLM validity.** Without evals and repair loops, real-world AST validity may disappoint. Build the harness early.
- **Security claims** need enforced limits, allow-lists and tests, not just the "no eval" design.
- **Naming/branding churn** hurts adoption. Settle it in Phase 0.
