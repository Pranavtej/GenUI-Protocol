import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ComponentRegistry } from "@ainative-ui/component-registry";
import { validateASTDocument } from "@ainative-ui/validation";
import { defaultASTDocument, UINode } from "@ainative-ui/ast";

const registry = new ComponentRegistry();

// Create the MCP Server
const mcpServer = new Server(
    {
        name: "genui-protocol-mcp-server",
        version: "1.0.0"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// Define tool lists
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "discover_components",
                description: "List all components available in the Generative UI Protocol with descriptions, category, and renderer compatibility.",
                inputSchema: { type: "object", properties: {} }
            },
            {
                name: "get_component",
                description: "Retrieve complete specification including properties and events for a given component name.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "The name of the component (e.g., 'kpi', 'chart', 'card')." }
                    },
                    required: ["name"]
                }
            },
            {
                name: "get_component_schema",
                description: "Retrieve raw JSON Schema for component properties validation.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Component type name." }
                    },
                    required: ["name"]
                }
            },
            {
                name: "get_examples",
                description: "Fetch AST examples showing correct structure and props for a component.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Component type name." }
                    },
                    required: ["name"]
                }
            },
            {
                name: "validate_ast",
                description: "Validate a given AST document against structures and schemas.",
                inputSchema: {
                    type: "object",
                    properties: {
                        root: { type: "object", description: "The root UINode element of the AST." },
                        renderer: { type: "string", description: "Optional target renderer (e.g. 'angular', 'react')." }
                    },
                    required: ["root"]
                }
            },
            {
                name: "normalize_ast",
                description: "Clean up an AST tree, adding unique IDs where missing and normalizing structure.",
                inputSchema: {
                    type: "object",
                    properties: {
                        root: { type: "object", description: "The root UINode to normalize." }
                    },
                    required: ["root"]
                }
            },
            {
                name: "generate_template",
                description: "Generate a boilerplate AST template for typical views like dashboard or workflow.",
                inputSchema: {
                    type: "object",
                    properties: {
                        type: { type: "string", enum: ["dashboard", "workflow", "form", "blank"] }
                    },
                    required: ["type"]
                }
            },
            {
                name: "list_renderers",
                description: "List all renderers supported by GenUI.",
                inputSchema: { type: "object", properties: {} }
            },
            {
                name: "search_components",
                description: "Search registered components by query string matching name or description.",
                inputSchema: {
                    type: "object",
                    properties: {
                        q: { type: "string", description: "Search query." }
                    },
                    required: ["q"]
                }
            }
        ]
    };
});

// Helper: recursive ID assignment
function assignMissingIds(node: UINode, path = "node"): UINode {
    const updated = { ...node };
    if (!updated.id) {
        updated.id = `${path}_${updated.t}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (updated.c) {
        updated.c = updated.c.map((child, idx) => assignMissingIds(child, `${updated.id}_c${idx}`));
    }
    return updated;
}

// Handle Tool Calls
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "discover_components": {
                return { content: [{ type: "text", text: JSON.stringify(registry.list(), null, 2) }] };
            }
            case "get_component":
            case "get_component_schema": {
                const compName = String(args?.name || "");
                const entry = registry.get(compName);
                if (!entry) {
                    return { isError: true, content: [{ type: "text", text: `Component "${compName}" not found.` }] };
                }
                return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
            }
            case "get_examples": {
                const compName = String(args?.name || "");
                const entry = registry.get(compName);
                if (!entry) {
                    return { isError: true, content: [{ type: "text", text: `Component "${compName}" not found.` }] };
                }
                return { content: [{ type: "text", text: JSON.stringify(entry.examples || [], null, 2) }] };
            }
            case "validate_ast": {
                const root = args?.root as UINode;
                const renderer = args?.renderer as string | undefined;
                const result = validateASTDocument(root, renderer);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "normalize_ast": {
                const root = args?.root as UINode;
                const normalized = assignMissingIds(root);
                return { content: [{ type: "text", text: JSON.stringify(normalized, null, 2) }] };
            }
            case "generate_template": {
                const templateType = String(args?.type || "dashboard");
                let rootNode: UINode;
                if (templateType === "workflow") {
                    rootNode = {
                        t: "page",
                        p: { title: "Approval Chain", subtitle: "Active workflows" },
                        c: [
                            {
                                t: "workflow",
                                p: {
                                    steps: [
                                        { id: "1", name: "Create Request", status: "completed" },
                                        { id: "2", name: "Manager Approval", status: "active" },
                                        { id: "3", name: "Deploy", status: "pending" }
                                    ]
                                }
                            }
                        ]
                    };
                } else if (templateType === "form") {
                    rootNode = {
                        t: "card",
                        p: { title: "Register Server Node" },
                        c: [
                            { t: "input", p: { label: "Node Hostname", placeholder: "e.g. node-01" } },
                            { t: "select", p: { label: "Zone", options: [{ label: "US-West", value: "us-w" }] } },
                            { t: "button", p: { label: "Create Node", variant: "default" } }
                        ]
                    };
                } else {
                    rootNode = {
                        t: "dashboard",
                        p: { title: "System Dashboard" },
                        c: [
                            { t: "kpi", p: { label: "Uptime", value: "99.98%" } },
                            { t: "chart", p: { type: "line", data: [{ label: "May", value: 100 }, { label: "Jun", value: 140 }] } }
                        ]
                    };
                }
                return { content: [{ type: "text", text: JSON.stringify(defaultASTDocument(rootNode), null, 2) }] };
            }
            case "list_renderers": {
                return { content: [{ type: "text", text: JSON.stringify(["react", "angular", "vue", "svelte", "react-native", "swiftui", "flutter"], null, 2) }] };
            }
            case "search_components": {
                const query = String(args?.q || "");
                return { content: [{ type: "text", text: JSON.stringify(registry.search(query), null, 2) }] };
            }
            default:
                return { isError: true, content: [{ type: "text", text: `Unknown tool "${name}"` }] };
        }
    } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: e.message || "Internal error during tool call." }] };
    }
});

// Dual Setup: Express server mode (useful for playground/testing) and Stdio mode
const startExpressServer = () => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    let sseClients: any[] = [];

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", mode: "http-mcp" });
    });

    app.get("/api/discover_components", (req, res) => {
        res.json(registry.list());
    });

    app.get("/api/get_component_schema", (req, res) => {
        const name = String(req.query.name || "");
        const entry = registry.get(name);
        res.json(entry || { error: "not_found" });
    });

    app.post("/api/validate_ast", (req, res) => {
        const { root, renderer } = req.body;
        res.json(validateASTDocument(root, renderer));
    });

    app.post("/api/normalize_ast", (req, res) => {
        res.json(assignMissingIds(req.body.root));
    });

    app.get("/api/get_examples", (req, res) => {
        const name = String(req.query.name || "");
        res.json(registry.get(name)?.examples || []);
    });

    app.get("/api/search_components", (req, res) => {
        const query = String(req.query.q || "");
        res.json(registry.search(query));
    });

    app.get("/api/stream", (req, res) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        sseClients.push(res);
        console.error(`Client connected to stream. Active clients: ${sseClients.length}`);

        req.on("close", () => {
            sseClients = sseClients.filter((client) => client !== res);
            console.error(`Client disconnected from stream. Active clients: ${sseClients.length}`);
        });
    });

    app.post("/api/stream_patch", (req, res) => {
        const { patches } = req.body; // Array of ASTPatch
        const payload = JSON.stringify({ type: "patch", patches });
        sseClients.forEach((client) => {
            client.write(`data: ${payload}\n\n`);
        });
        res.json({ status: "success", clientsNotified: sseClients.length });
    });

    app.post("/api/stream_ast", (req, res) => {
        const { ast } = req.body; // Full AST Document
        const payload = JSON.stringify({ type: "ast", ast });
        sseClients.forEach((client) => {
            client.write(`data: ${payload}\n\n`);
        });
        res.json({ status: "success", clientsNotified: sseClients.length });
    });

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.error(`GenUI MCP HTTP sidecar listening on port ${port}`);
    });
};

// Check argument or env for mode selection
if (process.argv.includes("--http") || process.env.GENUI_MCP_HTTP === "true") {
    startExpressServer();
} else {
    // Default to STDIO transport for direct AI execution
    const transport = new StdioServerTransport();
    mcpServer.connect(transport).then(() => {
        console.error("GenUI MCP Server running on STDIO transport");
    }).catch((err) => {
        console.error("Failed to connect STDIO transport:", err);
    });
    
    // Also spin up Express in the background to serve playground requests!
    startExpressServer();
}
