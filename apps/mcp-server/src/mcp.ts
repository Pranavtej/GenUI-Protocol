import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { UINode } from "@genui-protocol/ast";
import { defaultASTDocument } from "@genui-protocol/ast";
import type { ComponentRegistry } from "@genui-protocol/component-registry";
import { buildSystemPrompt } from "@genui-protocol/prompt-kit";
import { RENDERERS, TEMPLATES, assignMissingIds, astMetadata, astToMarkdown, buildTemplate, checkAst, suggestComponents } from "./core.js";

type Reply = { isError?: boolean; content: Array<{ type: "text"; text: string }> };
const text = (t: string): Reply => ({ content: [{ type: "text", text: t }] });
const fail = (t: string): Reply => ({ isError: true, content: [{ type: "text", text: t }] });

const nameArg = { type: "object", properties: { name: { type: "string", description: "Component type name (e.g. 'kpi', 'chart', 'card', 'button')." } }, required: ["name"] };
const rootArg = (description: string) => ({ type: "object", properties: { root: { type: "object", description } }, required: ["root"] });

const TOOL_LIST = [
    { name: "get_protocol_guide", description: "START HERE. Returns the rules for writing a GenUI document (structure, data binding with $bind/$tpl, declarative actions, forms) plus the full component catalogue with required props and worked examples. Read it before generating any UI.", inputSchema: { type: "object", properties: {} } },
    { name: "discover_components", description: "List every available component with category, description, props schema, events and renderer support.", inputSchema: { type: "object", properties: {} } },
    { name: "get_component", description: "Full specification of one component: props with types, events and examples.", inputSchema: nameArg },
    { name: "get_component_schema", description: "Raw JSON Schema of a component's props.", inputSchema: nameArg },
    { name: "get_examples", description: "Ready-made example nodes for a component.", inputSchema: nameArg },
    { name: "suggest_components", description: "Rank components that fit a natural-language UI need.", inputSchema: { type: "object", properties: { description: { type: "string", description: "e.g. 'a login form', 'a metrics dashboard'." } }, required: ["description"] } },
    { name: "generate_ast", description: "Wrap a root node into a complete document, adding missing node ids deterministically.", inputSchema: rootArg("Root node { t, p?, c? }.") },
    {
        name: "validate_ast",
        description: "Validate a GenUI document (preferred: pass `document`, which also checks the version and data) or a bare `root` node. Returns { valid, errors? }; fix every error before answering.",
        inputSchema: { type: "object", properties: { document: { type: "object", description: "Full document { version, data?, root }." }, root: { type: "object", description: "Bare root node (legacy)." }, renderer: { type: "string", description: "Optional target renderer." } } },
    },
    { name: "normalize_ast", description: "Add unique ids to every node that lacks one.", inputSchema: rootArg("Root node to normalize.") },
    { name: "generate_template", description: `Boilerplate document from a preset: ${Object.keys(TEMPLATES).join(", ")}. The 'form' template demonstrates data binding and a submit action.`, inputSchema: { type: "object", properties: { type: { type: "string", enum: Object.keys(TEMPLATES) } }, required: ["type"] } },
    { name: "list_renderers", description: "Supported rendering targets.", inputSchema: { type: "object", properties: {} } },
    { name: "search_components", description: "Search components by name or description.", inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] } },
    { name: "ast_metadata", description: "Node count, depth, component types and props used by a tree.", inputSchema: rootArg("Root node to analyze.") },
];

/** MCP server over the shared core functions. */
export const createMcpServer = (registry: ComponentRegistry): Server => {
    const server = new Server({ name: "genui-protocol-mcp-server", version: "1.0.0" }, { capabilities: { tools: {} } });

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_LIST }));

    server.setRequestHandler(CallToolRequestSchema, async (request): Promise<Reply> => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                case "get_protocol_guide":
                    return text(buildSystemPrompt({ registry }));

                case "discover_components": {
                    const list = registry.list();
                    return text(`# Available Components\n\n${list.map((e) => `- ${e.id} (${e.category}): ${e.description || "No description"}`).join("\n")}\n\n---\n\nFull JSON:\n${JSON.stringify(list, null, 2)}`);
                }

                case "get_component":
                case "get_component_schema":
                case "get_examples": {
                    const compName = String(args?.name || "");
                    const entry = registry.get(compName);
                    if (!entry) {
                        const hint = registry.search(compName).map((e) => e.id);
                        return fail(`Component "${compName}" not found.${hint.length ? ` Did you mean: ${hint.join(", ")}?` : ""}`);
                    }
                    return text(JSON.stringify(name === "get_examples" ? entry.examples ?? [] : name === "get_component_schema" ? entry.schema : entry, null, 2));
                }

                case "suggest_components": {
                    const desc = String(args?.description || "");
                    if (!desc) return fail("Please provide a description of what you want to build.");
                    const ranked = suggestComponents(registry, desc);
                    const top = ranked.length > 0 ? ranked : registry.list().slice(0, 5).map((component) => ({ component, score: 0 }));
                    const lines = top.map(({ component: c }) => {
                        const badges = [c.events?.length ? `events: ${c.events.join(", ")}` : "", c.renderers?.length ? `renderers: ${c.renderers.join(", ")}` : ""].filter(Boolean);
                        return `- **${c.id}** (${c.category})${badges.length ? ` [${badges.join(" | ")}]` : ""}${c.description ? `\n  ${c.description}` : ""}`;
                    });
                    return text(`# Suggested Components for "${desc}"\n\n${lines.join("\n\n")}`);
                }

                case "generate_ast": {
                    const root = args?.root as UINode;
                    if (!root?.t) return fail("Invalid AST: root node must have a 't' (type) field.");
                    const normalized = assignMissingIds(root);
                    return text(`${JSON.stringify(defaultASTDocument(normalized), null, 2)}\n\n---\nTree Structure:\n${astToMarkdown(normalized)}`);
                }

                case "validate_ast": {
                    if (args?.document === undefined && args?.root === undefined) return fail("Provide 'document' (preferred) or 'root'.");
                    const result = checkAst({ document: args?.document, root: args?.root, renderer: args?.renderer as string | undefined });
                    const details = result.errors?.length ? `\n\nErrors:\n${result.errors.map((e) => `- ${e}`).join("\n")}` : "";
                    return text(`${result.valid ? "✅ Valid" : "❌ Validation Failed"}${details}\n\nFull result:\n${JSON.stringify(result, null, 2)}`);
                }

                case "normalize_ast": {
                    const root = args?.root as UINode;
                    if (!root?.t) return fail("Provide a root node with a 't' field.");
                    const normalized = assignMissingIds(root);
                    return text(`${JSON.stringify(normalized, null, 2)}\n\n---\nTree Structure:\n${astToMarkdown(normalized)}`);
                }

                case "generate_template": {
                    const type = String(args?.type || "dashboard");
                    const doc = buildTemplate(type);
                    if (!doc) return fail(`Unknown template "${type}". Available: ${Object.keys(TEMPLATES).join(", ")}`);
                    return text(`# ${type.charAt(0).toUpperCase() + type.slice(1)} Template\n\n${JSON.stringify(doc, null, 2)}\n\n---\nTree Structure:\n${astToMarkdown(doc.root)}`);
                }

                case "list_renderers":
                    return text(`# Supported Renderers\n\n${RENDERERS.map((r) => `- **${r}**`).join("\n")}`);

                case "search_components": {
                    const query = String(args?.q || "");
                    const results = registry.search(query);
                    if (results.length === 0) return text(`No components found matching "${query}".`);
                    return text(`# Search Results for "${query}"\n\n${results.map((e) => `- **${e.id}** (${e.category}): ${e.description || ""}`).join("\n")}\n\n---\nFull JSON:\n${JSON.stringify(results, null, 2)}`);
                }

                case "ast_metadata": {
                    const root = args?.root as UINode;
                    if (!root?.t) return fail("Invalid AST: root node must have a 't' (type) field.");
                    const s = astMetadata(root);
                    const props = [...new Set(s.usedProps)];
                    return text(`# AST Metadata\n\n- **Total Nodes**: ${s.count}\n- **Max Depth**: ${s.maxDepth}\n- **Component Types**: ${Object.entries(s.types).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t} (${c})`).join(", ")}\n- **Unique Properties**: ${props.length ? props.join(", ") : "none"}`);
                }

                default:
                    return fail(`Unknown tool "${name}". Available tools: ${TOOL_LIST.map((t) => t.name).join(", ")}.`);
            }
        } catch (e) {
            return fail(`Error executing ${name}: ${e instanceof Error ? e.message : "Internal error"}`);
        }
    });

    return server;
};
