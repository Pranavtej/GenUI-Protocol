# Build from the repository root:  docker build -f apps/mcp-server/Dockerfile -t genui-mcp .
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "genui-protocol-mcp-server..."
RUN pnpm --filter "genui-protocol-mcp-server..." build
RUN pnpm --filter genui-protocol-mcp-server deploy --prod /out

FROM node:20-alpine
WORKDIR /app
COPY --from=build /out .
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000 GENUI_MCP_HTTP=true
# Set GENUI_API_KEY (and GENUI_CORS_ORIGINS) when exposing this beyond localhost.
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "dist/index.js"]
