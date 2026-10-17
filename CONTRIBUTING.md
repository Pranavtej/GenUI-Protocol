# Contributing

## Setup
```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```
Requires Node >= 18 and pnpm >= 8. Python parts (`apps/python-test`, `packages/sdk/python`) need Python 3.10+.

## Workflow
1. Open an issue for bugs or proposals (protocol changes need a short written rationale).
2. Branch from `main`, keep PRs small and focused.
3. Add or update tests and docs with your change.
4. Make sure `pnpm build`, `pnpm lint` and `pnpm test` pass.

Compiled output (`*.js`, `*.d.ts`, `dist/`) is never committed.
