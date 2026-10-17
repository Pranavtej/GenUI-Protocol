# Changesets

Every change that affects a published package needs a changeset: run `pnpm changeset`, pick the packages, choose major/minor/patch and describe the change for users. All `@genui-protocol/*` packages are versioned together (`fixed`), so one bump moves them all.

The release workflow turns pending changesets into a "Version Packages" pull request; merging it publishes to npm with provenance. The Python SDK (`packages/sdk/python`) is released separately by tagging `py-vX.Y.Z`.
