# Examples

Three documents that cover the protocol end to end, plus ways to run them.

| Example | Shows |
|---|---|
| **Analytics dashboard** (`analytics-dashboard`) | Data binding, tabs, charts, a table, a `select` that drives the title, a dialog that emits an event |
| **Access request workflow** (`access-request`) | A bound form that *submits* to an agent; the agent replies with data patches that advance a workflow |
| **Agent run monitor** (`agent-monitoring`) | Execution graph + timeline + counters updated by sequenced stream frames |

All three live in [`documents/`](documents) as typed builders (`@genui-protocol/examples`) with a scripted agent, so the full UI → agent → UI loop runs without an API key. They are tested in CI: every document validates, renders in React, applies its live frames in order, and the workflow example round-trips a form submission.

## Run them

```bash
pnpm install && pnpm build

# React: pick an example, press "Play stream", submit the form
pnpm --filter genui-protocol-example-react dev          # http://localhost:4175

# Angular: the playground has them as presets (Dashboard / Access request / Agent run)
pnpm --filter playground-angular serve

# Stream one to a running MCP server (see the script header)
node apps/mcp-server/dist/index.js --http &
node examples/node/stream-demo.mjs

# Python SDK
pip install -e packages/sdk/python && python examples/python/build_dashboard.py
```
