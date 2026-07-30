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

const mcpServer = new Server(
  { name: "genui-protocol-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

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

function astToMarkdown(node: UINode, depth = 0): string {
  const indent = "  ".repeat(depth);
  const props = node.p ? Object.entries(node.p).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ") : "";
  let md = `${indent}- **\`${node.t}\`**${props ? ` (${props})` : ""}`;
  if (node.c) {
    md += "\n" + node.c.map((child) => astToMarkdown(child, depth + 1)).join("\n");
  }
  return md;
}

const TEMPLATES: Record<string, UINode> = {
  dashboard: {
    t: "dashboard",
    p: { title: "System Dashboard" },
    c: [
      { t: "kpi", p: { label: "Uptime", value: "99.98%" } },
      { t: "kpi", p: { label: "Active Users", value: "1,284" } },
      { t: "chart", p: { type: "line", title: "Daily Traffic", data: [{ label: "Mon", value: 100 }, { label: "Tue", value: 140 }, { label: "Wed", value: 120 }] } },
    ],
  },
  workflow: {
    t: "page",
    p: { title: "Approval Chain", subtitle: "Active workflows" },
    c: [{
      t: "workflow",
      p: {
        steps: [
          { id: "1", name: "Create Request", status: "completed" },
          { id: "2", name: "Manager Approval", status: "active" },
          { id: "3", name: "Deploy", status: "pending" },
        ],
      },
    }],
  },
  form: {
    t: "card",
    p: { title: "Register Server Node" },
    c: [
      { t: "input", p: { label: "Node Hostname", placeholder: "e.g. node-01" } },
      { t: "select", p: { label: "Zone", options: [{ label: "US-West", value: "us-w" }, { label: "EU-Central", value: "eu-c" }] } },
      { t: "input", p: { label: "Tags", placeholder: "comma-separated" } },
      { t: "checkbox", p: { label: "Enable monitoring", checked: true } },
      { t: "button", p: { label: "Create Node", variant: "default" } },
    ],
  },
  analytics: {
    t: "page",
    p: { title: "Analytics Overview", subtitle: "Real-time metrics" },
    c: [
      { t: "grid", p: { columns: 4, gap: "16px" }, c: [
        { t: "kpi", p: { label: "Page Views", value: "84,203", trend: "up", trendValue: "+12%" } },
        { t: "kpi", p: { label: "Bounce Rate", value: "32.1%", trend: "down", trendValue: "-2%" } },
        { t: "kpi", p: { label: "Avg. Session", value: "4m 32s", trend: "up", trendValue: "+8%" } },
        { t: "kpi", p: { label: "Conversions", value: "2,847", trend: "up", trendValue: "+24%" } },
      ]},
      { t: "section", p: { title: "Traffic Sources" }, c: [
        { t: "chart", p: { type: "bar", data: [{ label: "Organic", value: 45 }, { label: "Direct", value: 30 }, { label: "Referral", value: 15 }, { label: "Social", value: 10 }] } },
      ]},
      { t: "card", p: { title: "Recent Activity" }, c: [
        { t: "table", p: {
          columns: [{ header: "Event", accessor: "event" }, { header: "Source", accessor: "source" }, { header: "Time", accessor: "time" }],
          data: [
            { event: "User Signup", source: "Organic", time: "2m ago" },
            { event: "Payment Received", source: "Direct", time: "5m ago" },
            { event: "Account Deactivated", source: "Admin", time: "12m ago" },
          ],
        }},
      ]},
    ],
  },
  chat: {
    t: "card",
    p: { title: "AI Assistant" },
    c: [
      { t: "text", p: { content: "Hello! How can I help you today?" } },
      { t: "input", p: { label: "Message", placeholder: "Type your message..." } },
      { t: "flex", p: { gap: "8px", justifyContent: "flex-end" }, c: [
        { t: "button", p: { label: "Send", variant: "default" } },
        { t: "button", p: { label: "Cancel", variant: "outline" } },
      ]},
    ],
  },
  settings: {
    t: "page",
    p: { title: "Settings", subtitle: "Manage your preferences" },
    c: [
      { t: "tabs", p: { items: [{ label: "General", value: "general" }, { label: "Notifications", value: "notifications" }, { label: "Security", value: "security" }] } },
      { t: "section", p: { title: "Profile" }, c: [
        { t: "input", p: { label: "Display Name", value: "Jane Doe" } },
        { t: "input", p: { label: "Email", value: "jane@example.com" } },
      ]},
      { t: "section", p: { title: "Preferences" }, c: [
        { t: "select", p: { label: "Language", options: [{ label: "English", value: "en" }, { label: "Spanish", value: "es" }] } },
        { t: "checkbox", p: { label: "Email notifications", checked: true } },
        { t: "button", p: { label: "Save Changes", variant: "default" } },
      ]},
    ],
  },
  blank: {
    t: "card",
    p: { title: "New View" },
    c: [{ t: "text", p: { content: "Start building your interface here." } }],
  },
};

// ---------------------------------------------------------------------------
// Tool List
// ---------------------------------------------------------------------------
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "discover_components",
        description: "List every component available in the GenUI Protocol. Returns an array of registry entries with name, category, description, required properties, supported events, and renderer compatibility. Use this first to understand what building blocks are available.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_component",
        description: "Retrieve the complete specification for a single component, including its properties with types, default values, events it can emit, and example usage. Use this when you need detailed knowledge about a specific component to construct an AST.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Component type name (e.g., 'kpi', 'chart', 'card', 'button')." },
          },
          required: ["name"],
        },
      },
      {
        name: "get_component_schema",
        description: "Get the raw JSON Schema for a component's properties. Useful for programmatic validation or when building type-safe AST generators.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Component type name." },
          },
          required: ["name"],
        },
      },
      {
        name: "get_examples",
        description: "Fetch pre-built AST examples for a specific component. Each example shows the correct node structure, property names, and nesting pattern. Study these to learn how to construct valid AST nodes.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Component type name." },
          },
          required: ["name"],
        },
      },
      {
        name: "suggest_components",
        description: "Given a natural language description of a UI need, this returns a ranked list of components that would be appropriate, along with reasoning. Use this when designing a new view and you want to know which components best fit the use case.",
        inputSchema: {
          type: "object",
          properties: {
            description: { type: "string", description: "Describe what you want to build (e.g., 'a login form', 'a data dashboard with charts', 'a settings page')." },
          },
          required: ["description"],
        },
      },
      {
        name: "generate_ast",
        description: "Generate a complete, valid AST from a structured description. You provide the component tree structure and properties, and this tool returns a normalized ASTDocument with auto-generated IDs, wrapped in the correct document format. Prefer this over hand-writing AST JSON.",
        inputSchema: {
          type: "object",
          properties: {
            root: { type: "object", description: "The root UINode describing the interface structure. Follow the pattern { t: 'type', p: { ...props }, c: [ ...children ] }." },
            renderer: { type: "string", description: "Optional: target renderer hint (e.g., 'angular', 'react')." },
          },
          required: ["root"],
        },
      },
      {
        name: "validate_ast",
        description: "Validate a complete AST document against the GenUI Protocol schemas. Returns { valid: boolean, errors?: string[] } with detailed error messages for any structural or type violations. Always validate before generating a final response.",
        inputSchema: {
          type: "object",
          properties: {
            root: { type: "object", description: "The root UINode to validate." },
            renderer: { type: "string", description: "Optional target renderer for renderer-specific validation." },
          },
          required: ["root"],
        },
      },
      {
        name: "normalize_ast",
        description: "Normalize an AST tree by adding unique IDs to every node that lacks one and ensuring structural consistency. Use this to clean up hand-written or AI-generated ASTs before validation.",
        inputSchema: {
          type: "object",
          properties: {
            root: { type: "object", description: "The root UINode to normalize." },
          },
          required: ["root"],
        },
      },
      {
        name: "generate_template",
        description: "Generate a complete boilerplate AST from a preset template type. Available templates: 'dashboard' (KPI cards + chart), 'workflow' (step-by-step process), 'form' (input fields + button), 'analytics' (rich metrics dashboard with table), 'chat' (conversation UI), 'settings' (multi-tab settings page), 'blank' (empty starter).",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: Object.keys(TEMPLATES), description: "Template type to generate." },
          },
          required: ["type"],
        },
      },
      {
        name: "list_renderers",
        description: "List all supported rendering targets. Each renderer maps the GenUI AST to a specific UI framework. Use this to know which renderers are available.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "search_components",
        description: "Fuzzy-search components by name or description. Returns matching registry entries. Use this when you know what you need but aren't sure of the exact component name.",
        inputSchema: {
          type: "object",
          properties: {
            q: { type: "string", description: "Search query (e.g., 'chart', 'input', 'navigation')." },
          },
          required: ["q"],
        },
      },
      {
        name: "ast_metadata",
        description: "Get detailed metadata and statistics about an AST tree, including node count, component types used, depth, and structural analysis. Useful for understanding or debugging complex ASTs.",
        inputSchema: {
          type: "object",
          properties: {
            root: { type: "object", description: "The root UINode to analyze." },
          },
          required: ["root"],
        },
      },
    ],
  };
});

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ---- Discovery -------------------------------------------------------
      case "discover_components": {
        const list = registry.list();
        const summary = list.map((e) => `- ${e.id} (${e.category}): ${e.description || "No description"}`);
        return {
          content: [
            { type: "text", text: `# Available Components\n\n${summary.join("\n")}\n\n---\n\nFull JSON:\n${JSON.stringify(list, null, 2)}` },
          ],
        };
      }

      case "get_component":
      case "get_component_schema": {
        const compName = String(args?.name || "");
        const entry = registry.get(compName);
        if (!entry) {
          const suggestions = registry.search(compName).map((e) => e.id);
          const hint = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(", ")}?` : "";
          return { isError: true, content: [{ type: "text", text: `Component "${compName}" not found.${hint}` }] };
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

      // ---- AI / Generation -------------------------------------------------
      case "suggest_components": {
        const desc = String(args?.description || "").toLowerCase();
        if (!desc) {
          return { isError: true, content: [{ type: "text", text: "Please provide a description of what you want to build." }] };
        }

        const all = registry.list();
        const scored = all.map((comp) => {
          let score = 0;
          const name = comp.id.toLowerCase();
          const cat = comp.category.toLowerCase();

          if (desc.includes("form") || desc.includes("input") || desc.includes("register") || desc.includes("login") || desc.includes("signup")) {
            if (cat === "forms") score += 3;
            if (name === "input" || name === "select" || name === "checkbox" || name === "textarea") score += 2;
            if (name === "button") score += 2;
          }
          if (desc.includes("dashboard") || desc.includes("overview") || desc.includes("metrics") || desc.includes("analytics")) {
            if (name === "dashboard" || name === "kpi") score += 3;
            if (name === "chart") score += 3;
            if (name === "table") score += 2;
            if (cat === "data") score += 1;
          }
          if (desc.includes("chart") || desc.includes("graph") || desc.includes("visualize")) {
            if (name === "chart") score += 3;
            if (name === "kpi") score += 1;
          }
          if (desc.includes("list") || desc.includes("table") || desc.includes("grid") || desc.includes("data")) {
            if (name === "table") score += 3;
            if (name === "grid") score += 2;
            if (name === "list") score += 2;
          }
          if (desc.includes("setting") || desc.includes("preference") || desc.includes("config")) {
            if (name === "tabs") score += 2;
            if (cat === "forms") score += 2;
            if (name === "checkbox") score += 2;
            if (name === "select") score += 2;
          }
          if (desc.includes("chat") || desc.includes("message") || desc.includes("conversation")) {
            if (name === "text") score += 2;
            if (name === "input") score += 2;
            if (name === "flex") score += 1;
          }
          if (desc.includes("card") || desc.includes("section") || desc.includes("layout")) {
            if (name === "card") score += 2;
            if (name === "section") score += 2;
            if (name === "flex" || name === "grid" || name === "stack") score += 1;
          }
          if (desc.includes("modal") || desc.includes("dialog") || desc.includes("overlay") || desc.includes("popup")) {
            if (name === "dialog") score += 3;
            if (name === "drawer") score += 3;
          }
          if (desc.includes("step") || desc.includes("workflow") || desc.includes("process") || desc.includes("pipeline")) {
            if (name === "workflow") score += 3;
            if (name === "timeline") score += 2;
          }
          if (desc.includes("navigate") || desc.includes("tab") || desc.includes("switch")) {
            if (name === "tabs") score += 3;
          }

          return { component: comp, score };
        });

        const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
        const top = ranked.length > 0 ? ranked : scored.sort((a, b) => b.score - a.score).slice(0, 5);

        const lines = top.map((s) => {
          const badges = [];
          if (s.component.events?.length) badges.push(`events: ${s.component.events.join(", ")}`);
          if (s.component.renderers?.length) badges.push(`renderers: ${s.component.renderers.join(", ")}`);
          const parts = `- **${s.component.id}** (${s.component.category})${badges.length ? ` [${badges.join(" | ")}]` : ""}`;
          return s.component.description ? `${parts}\n  ${s.component.description}` : parts;
        });

        return {
          content: [{ type: "text", text: `# Suggested Components for "${desc}"\n\n${lines.join("\n\n")}` }],
        };
      }

      case "generate_ast": {
        const root = args?.root as UINode;
        if (!root || !root.t) {
          return { isError: true, content: [{ type: "text", text: "Invalid AST: root node must have a 't' (type) field." }] };
        }
        const normalized = assignMissingIds(root);
        const doc = defaultASTDocument(normalized);
        return {
          content: [{ type: "text", text: `${JSON.stringify(doc, null, 2)}\n\n---\nTree Structure:\n${astToMarkdown(normalized)}` }],
        };
      }

      // ---- Validation & Normalization -------------------------------------
      case "validate_ast": {
        const root = args?.root as UINode;
        if (!root) {
          return { isError: true, content: [{ type: "text", text: "Missing 'root' in arguments." }] };
        }
        const renderer = args?.renderer as string | undefined;
        const result = validateASTDocument(root, renderer);
        const status = result.valid ? "✅ Valid AST" : "❌ Validation Failed";
        const details = result.errors?.length ? `\n\nErrors:\n${result.errors.map((e) => `- ${e}`).join("\n")}` : "";
        return { content: [{ type: "text", text: `${status}${details}\n\nFull result:\n${JSON.stringify(result, null, 2)}` }] };
      }

      case "normalize_ast": {
        const root = args?.root as UINode;
        const normalized = assignMissingIds(root);
        return { content: [{ type: "text", text: `${JSON.stringify(normalized, null, 2)}\n\n---\nTree Structure:\n${astToMarkdown(normalized)}` }] };
      }

      // ---- Templates -------------------------------------------------------
      case "generate_template": {
        const templateType = String(args?.type || "dashboard") as keyof typeof TEMPLATES;
        const rootNode = TEMPLATES[templateType];
        if (!rootNode) {
          return { isError: true, content: [{ type: "text", text: `Unknown template "${templateType}". Available: ${Object.keys(TEMPLATES).join(", ")}` }] };
        }
        const cloned = JSON.parse(JSON.stringify(rootNode)) as UINode;
        const doc = defaultASTDocument(assignMissingIds(cloned));
        return {
          content: [{ type: "text", text: `# ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template\n\n${JSON.stringify(doc, null, 2)}\n\n---\nTree Structure:\n${astToMarkdown(doc.root)}` }],
        };
      }

      // ---- Renderers -------------------------------------------------------
      case "list_renderers": {
        const renderers = ["react", "angular", "vue", "svelte", "react-native", "swiftui", "flutter"];
        return {
          content: [{ type: "text", text: `# Supported Renderers\n\n${renderers.map((r) => `- **${r}**`).join("\n")}` }],
        };
      }

      // ---- Search ----------------------------------------------------------
      case "search_components": {
        const query = String(args?.q || "");
        const results = registry.search(query);
        if (results.length === 0) {
          return { content: [{ type: "text", text: `No components found matching "${query}".` }] };
        }
        return {
          content: [{ type: "text", text: `# Search Results for "${query}"\n\n${results.map((e) => `- **${e.id}** (${e.category}): ${e.description || ""}`).join("\n")}\n\n---\nFull JSON:\n${JSON.stringify(results, null, 2)}` }],
        };
      }

      // ---- Analysis --------------------------------------------------------
      case "ast_metadata": {
        const root = args?.root as UINode;
        if (!root || !root.t) {
          return { isError: true, content: [{ type: "text", text: "Invalid AST: root node must have a 't' (type) field." }] };
        }

        function walk(node: UINode, depth: number): { count: number; types: Record<string, number>; maxDepth: number; usedProps: string[] } {
          let count = 1;
          const types: Record<string, number> = { [node.t]: 1 };
          let maxDepth = depth;
          const usedProps = node.p ? Object.keys(node.p) : [];

          if (node.c) {
            for (const child of node.c) {
              const sub = walk(child, depth + 1);
              count += sub.count;
              for (const [t, c] of Object.entries(sub.types)) {
                types[t] = (types[t] || 0) + c;
              }
              maxDepth = Math.max(maxDepth, sub.maxDepth);
              usedProps.push(...sub.usedProps);
            }
          }

          return { count, types, maxDepth, usedProps };
        }

        const stats = walk(root, 1);
        const uniqueProps = [...new Set(stats.usedProps)];

        return {
          content: [{
            type: "text",
            text: `# AST Metadata\n\n- **Total Nodes**: ${stats.count}\n- **Max Depth**: ${stats.maxDepth}\n- **Component Types**: ${Object.entries(stats.types).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t} (${c})`).join(", ")}\n- **Unique Properties**: ${uniqueProps.length > 0 ? uniqueProps.join(", ") : "none"}`,
          }],
        };
      }

      default:
        return { isError: true, content: [{ type: "text", text: `Unknown tool "${name}". Available tools: discover_components, get_component, suggest_components, generate_ast, validate_ast, normalize_ast, generate_template, list_renderers, search_components, ast_metadata.` }] };
    }
  } catch (e: any) {
    return { isError: true, content: [{ type: "text", text: `Error executing ${name}: ${e.message || "Internal error"}` }] };
  }
});

// ---------------------------------------------------------------------------
// Express Sidecar
// ---------------------------------------------------------------------------
const startExpressServer = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: "10mb" }));

  let sseClients: any[] = [];

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", mode: "http-mcp" });
  });

  app.get("/api/health/ready", (_req, res) => {
    res.json({ status: "ready", components: registry.list().length, renderers: 7 });
  });

  app.get("/api/discover_components", (_req, res) => {
    res.json(registry.list());
  });

  app.get("/api/get_component", (req, res) => {
    const name = String(req.query.name || "");
    const entry = registry.get(name);
    if (!entry) return res.status(404).json({ error: "not_found", message: `Component "${name}" not found.` });
    res.json(entry);
  });

  app.post("/api/suggest_components", (req, res) => {
    const { description } = req.body;
    const all = registry.list();
    if (!description) {
      return res.status(400).json({ error: "missing_description", message: "Provide a 'description' field." });
    }
    const scored = all.map((comp) => {
      let score = 0;
      const name = comp.id.toLowerCase();
      const cat = comp.category.toLowerCase();
      const desc = description.toLowerCase();

      if (/form|input|register|login|signup/.test(desc)) {
        if (cat === "forms") score += 3;
        if (/input|select|checkbox|textarea/.test(name)) score += 2;
        if (name === "button") score += 2;
      }
      if (/dashboard|overview|metrics|analytics/.test(desc)) {
        if (/dashboard|kpi/.test(name)) score += 3;
        if (name === "chart") score += 3;
        if (name === "table") score += 2;
      }
      if (/setting|preference|config/.test(desc)) {
        if (name === "tabs") score += 2;
        if (cat === "forms") score += 2;
      }
      if (/chat|message|conversation/.test(desc)) {
        if (name === "text") score += 2;
        if (name === "input") score += 2;
      }
      if (/modal|dialog|overlay|popup/.test(desc)) {
        if (/dialog|drawer/.test(name)) score += 3;
      }
      if (/step|workflow|process|pipeline/.test(desc)) {
        if (name === "workflow") score += 3;
        if (name === "timeline") score += 2;
      }
      if (/list|table|grid/.test(desc) && cat === "data") score += 2;

      return { component: comp, score, reason: "" };
    });

    const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    res.json({ suggestions: ranked.slice(0, 10), total: all.length });
  });

  app.post("/api/generate_ast", (req, res) => {
    const { root } = req.body;
    if (!root || !root.t) {
      return res.status(400).json({ error: "invalid_ast", message: "Root node must have a 't' (type) field." });
    }
    const normalized = assignMissingIds(root);
    res.json(defaultASTDocument(normalized));
  });

  app.post("/api/validate_ast", (req, res) => {
    const { root, renderer } = req.body;
    res.json(validateASTDocument(root, renderer));
  });

  app.post("/api/normalize_ast", (req, res) => {
    const { root } = req.body;
    if (!root) return res.status(400).json({ error: "missing_root" });
    res.json(assignMissingIds(root));
  });

  app.get("/api/generate_template", (req, res) => {
    const templateType = String(req.query.type || "dashboard") as keyof typeof TEMPLATES;
    const rootNode = TEMPLATES[templateType];
    if (!rootNode) {
      return res.status(404).json({ error: "unknown_template", available: Object.keys(TEMPLATES) });
    }
    const cloned = JSON.parse(JSON.stringify(rootNode)) as UINode;
    res.json(defaultASTDocument(assignMissingIds(cloned)));
  });

  app.get("/api/list_renderers", (_req, res) => {
    res.json(["react", "angular", "vue", "svelte", "react-native", "swiftui", "flutter"]);
  });

  app.get("/api/search_components", (req, res) => {
    const query = String(req.query.q || "");
    res.json(registry.search(query));
  });

  app.post("/api/ast_metadata", (req, res) => {
    const { root } = req.body;
    if (!root || !root.t) {
      return res.status(400).json({ error: "invalid_ast" });
    }

    function walk(node: UINode, depth: number): any {
      let count = 1;
      const types: Record<string, number> = { [node.t]: 1 };
      let maxDepth = depth;
      const usedProps = node.p ? Object.keys(node.p) : [];
      if (node.c) {
        for (const child of node.c) {
          const sub = walk(child, depth + 1);
          count += sub.count;
          for (const [t, c] of Object.entries(sub.types)) types[t] = (types[t] || 0) + c;
          maxDepth = Math.max(maxDepth, sub.maxDepth);
          usedProps.push(...sub.usedProps);
        }
      }
      return { count, types, maxDepth, usedProps };
    }

    res.json(walk(root, 1));
  });

  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  app.post("/api/stream_patch", (req, res) => {
    const { patches } = req.body;
    const payload = JSON.stringify({ type: "patch", patches });
    sseClients.forEach((client) => client.write(`data: ${payload}\n\n`));
    res.json({ status: "success", clientsNotified: sseClients.length });
  });

  app.post("/api/stream_ast", (req, res) => {
    const { ast } = req.body;
    const payload = JSON.stringify({ type: "ast", ast });
    sseClients.forEach((client) => client.write(`data: ${payload}\n\n`));
    res.json({ status: "success", clientsNotified: sseClients.length });
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.error(`GenUI MCP HTTP sidecar listening on port ${port}`);
  });
};

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
if (process.argv.includes("--http") || process.env.GENUI_MCP_HTTP === "true") {
  startExpressServer();
} else {
  const transport = new StdioServerTransport();
  mcpServer.connect(transport).then(() => {
    console.error("GenUI MCP Server running on STDIO transport");
  }).catch((err) => {
    console.error("Failed to connect STDIO transport:", err);
  });
}
