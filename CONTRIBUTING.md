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

## Dependency updates

Dependabot opens weekly pull requests (`.github/dependabot.yml`): minor and patch updates are grouped per ecosystem. The `Dependabot auto-merge` workflow approves those and turns on auto-merge, so GitHub merges them as soon as the required checks (`node`, `packages`, `python`) pass. **Major updates are never auto-merged** and get a `needs-review` label: read the changelog, run the apps, then merge by hand.

Repository setup this relies on: *Allow auto-merge* enabled, branch protection on `main` requiring those checks, and (if reviews are required) *Allow GitHub Actions to create and approve pull requests*.
