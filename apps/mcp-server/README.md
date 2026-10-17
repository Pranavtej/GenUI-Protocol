# GenUI MCP server

Gives AI agents everything they need to produce GenUI documents: the protocol guide, the component catalogue, validation, templates and live streaming.

## Run

```bash
pnpm --filter genui-protocol-mcp-server build
node apps/mcp-server/dist/index.js            # MCP over stdio (for Claude Desktop, IDEs, ...)
node apps/mcp-server/dist/index.js --http     # REST + SSE sidecar on 127.0.0.1:4000
docker build -f apps/mcp-server/Dockerfile -t genui-mcp . && docker run -p 4000:4000 -e GENUI_API_KEY=... genui-mcp
```

Start with the `get_protocol_guide` tool (or `GET /api/protocol_guide`): it returns the system prompt that teaches a model the document format, data binding, actions and the component catalogue.

## Configuration (environment)

| Variable | Default | Meaning |
|---|---|---|
| `HOST` / `PORT` | `127.0.0.1` / `4000` | Bind address. A warning is logged when binding a non-loopback host without a key. |
| `GENUI_API_KEY` | unset | When set, every `/api` route except `/api/health*` needs `Authorization: Bearer <key>` (or `X-API-Key`). |
| `GENUI_CORS_ORIGINS` | `*` | Comma-separated allow-list; empty disables CORS headers. |
| `GENUI_BODY_LIMIT` | `1mb` | Max request body. |
| `GENUI_RATE_MAX` / `GENUI_RATE_WINDOW_MS` | `120` / `60000` | Requests per window per key/IP (`0` disables). Health is exempt. |
| `GENUI_MAX_SSE_CLIENTS` | `100` | Concurrent `/api/stream` subscribers. |
| `GENUI_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error`, `silent`. JSON lines on stderr. |

## Streaming

`POST /api/stream_ast` (validated document → `snapshot`), `/api/stream_patch`, `/api/stream_data` publish sequenced frames (spec §6) to `GET /api/stream`. Late joiners receive the latest snapshot plus the frames since. If more than 200 frames accumulate without a new snapshot the replay history is dropped; publish a fresh snapshot to give new subscribers a baseline.
