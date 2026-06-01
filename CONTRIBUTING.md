# Contributing to AI-Native UI Runtime

Thank you for contributing to the AI-Native UI Runtime project.

## How to contribute

1. Open an issue describing the feature, enhancement, or bug.
2. Create a branch from `main`.
3. Keep changes scoped to one feature or fix.
4. Add tests and documentation for new behavior.
5. Submit a PR with a clear summary and link to the issue.

## Code style

- Use TypeScript for packages and app code.
- Keep runtime logic in `packages/runtime-core`.
- Keep renderers thin: packages under `packages/renderer-*` should only adapt runtime nodes.
- Use JSON Schema for component metadata and model validation.

## Monorepo workflows

- `pnpm install` — install dependencies.
- `pnpm build` — build all packages and apps.
- `pnpm dev` — start local development for apps.
- `pnpm lint` — run linting across packages.
- `pnpm test` — run package tests.

## Governance

This project is designed for long-term extensibility:
- Add new components under `packages/components-*`.
- Add new renderers under `packages/renderer-*`.
- Add new AI tools under `apps/mcp-server`.
- Extend the protocol through `packages/protocol` and `packages/schemas`.
