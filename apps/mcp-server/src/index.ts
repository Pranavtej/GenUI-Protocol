import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { createHttpApp } from "./http.js";
import { createMcpServer } from "./mcp.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);
const registry = new ComponentRegistry();

if (process.argv.includes("--http") || process.env.GENUI_MCP_HTTP === "true") {
    const loopback = ["127.0.0.1", "::1", "localhost"].includes(config.host);
    if (!config.apiKey && !loopback) logger.warn("listening on a non-loopback host without GENUI_API_KEY: the API is unauthenticated", { host: config.host });
    createHttpApp({ registry, config, logger })
        .listen()
        .then(() => logger.info("GenUI MCP HTTP sidecar listening", { host: config.host, port: config.port, auth: Boolean(config.apiKey) }));
} else {
    createMcpServer(registry)
        .connect(new StdioServerTransport())
        .then(() => logger.info("GenUI MCP Server running on STDIO transport"))
        .catch((err) => {
            logger.error("Failed to connect STDIO transport", { message: String(err) });
            process.exit(1);
        });
}
