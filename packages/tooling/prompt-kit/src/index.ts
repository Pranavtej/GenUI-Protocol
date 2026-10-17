import type { ASTDocument } from "@genui-protocol/ast";
import { ACTION_KINDS, PROTOCOL_VERSION } from "@genui-protocol/protocol";
import { ComponentRegistry, type RegistryEntry } from "@genui-protocol/component-registry";

export type FewShot = { request: string; document: ASTDocument };

/** Worked examples. Every one is validated against the real validator in this package's tests. */
export const FEW_SHOTS: FewShot[] = [
    {
        request: "Show monthly revenue and active users with a traffic chart.",
        document: {
            version: PROTOCOL_VERSION,
            data: {
                metrics: { revenue: "$94,201", users: "12,847" },
                traffic: [{ label: "Mon", value: 100 }, { label: "Tue", value: 140 }, { label: "Wed", value: 120 }],
            },
            root: {
                t: "page",
                p: { title: "Overview" },
                c: [
                    {
                        t: "grid",
                        p: { cols: 2 },
                        c: [
                            { t: "kpi", id: "revenue", p: { label: "Revenue", value: { $bind: "metrics.revenue" }, trend: "up", trendValue: "+8%" } },
                            { t: "kpi", id: "users", p: { label: "Active users", value: { $bind: "metrics.users" } } },
                        ],
                    },
                    { t: "chart", p: { type: "bar", title: "Daily traffic", data: { $bind: "traffic" } } },
                ],
            },
        },
    },
    {
        request: "A signup form that sends the name and plan to me when submitted.",
        document: {
            version: PROTOCOL_VERSION,
            data: { form: { name: "", plan: "free" } },
            root: {
                t: "card",
                p: { title: "Create account" },
                c: [
                    { t: "input", id: "name", p: { label: "Name", value: { $bind: "form.name" } } },
                    { t: "select", id: "plan", p: { label: "Plan", value: { $bind: "form.plan" }, options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] } },
                    { t: "text", p: { content: { $tpl: "Signing up {{form.name}} on {{form.plan}}" }, color: "muted" } },
                    { t: "button", id: "submit", p: { label: "Sign up", onClick: { do: "submit", name: "signup", from: "form" } } },
                ],
            },
        },
    },
    {
        request: "Show the status of my 3-step deployment.",
        document: {
            version: PROTOCOL_VERSION,
            root: {
                t: "page",
                p: { title: "Deployment" },
                c: [
                    {
                        t: "workflow",
                        p: {
                            steps: [
                                { id: "1", name: "Build", status: "completed", duration: "42s" },
                                { id: "2", name: "Test", status: "active" },
                                { id: "3", name: "Release", status: "pending" },
                            ],
                        },
                    },
                    { t: "button", p: { label: "Cancel run", variant: "destructive", onClick: { do: "emit", name: "cancel_deploy" } } },
                ],
            },
        },
    },
];

const propLine = (entry: RegistryEntry): string => {
    const props = (entry.schema as { properties?: Record<string, { type?: string; enum?: unknown[] }>; required?: string[] }).properties ?? {};
    const required = new Set((entry.schema as { required?: string[] }).required ?? []);
    const parts = Object.entries(props).map(([k, def]) => {
        const type = def.enum ? def.enum.map(String).join("|") : (def.type ?? "any");
        return `${k}${required.has(k) ? "*" : ""}:${type}`;
    });
    const events = entry.events?.length ? ` events: ${entry.events.join(", ")}` : "";
    return `- ${entry.id} — ${entry.description ?? entry.category}. props: ${parts.join(", ") || "(none)"}.${events}`;
};

/** Component catalogue generated from the registry, so it can never drift from what validators accept. */
export const componentCatalogue = (registry: ComponentRegistry = new ComponentRegistry()): string =>
    registry.list().map(propLine).join("\n");

export type PromptOptions = {
    registry?: ComponentRegistry;
    /** Include the worked examples (default true). */
    fewShots?: boolean;
};

/** System prompt teaching a model to answer with a GenUI document instead of text/HTML/code. */
export const buildSystemPrompt = (options: PromptOptions = {}): string => {
    const shots = options.fewShots === false ? "" : "\n\n# Examples\n\n" + FEW_SHOTS.map((s) => `Request: ${s.request}\n${JSON.stringify(s.document)}`).join("\n\n");
    return `You build user interfaces by emitting a GenUI document: strict JSON, never HTML, CSS, JavaScript or markdown.

# Output
Reply with ONE JSON object (no prose, no code fences unless asked):
{ "version": "${PROTOCOL_VERSION}", "data"?: { ... }, "root": <node> }

A node is { "t": <component type>, "id"?: string, "p"?: { props }, "c"?: [ child nodes ] } — no other keys.

# Rules
1. Use ONLY the components and props listed below. Do not invent components, props or action kinds. Props marked * are required.
2. Give every node in a list, table-like group or anything that may be updated later a unique "id".
3. Put data in "data" and reference it with { "$bind": "path.to.value" } (optional "default"), or interpolate with { "$tpl": "Hello {{user.name}}" }. These are lookups only — there are no expressions or functions. Use this for values that may change or repeat (metrics, chart/table data, form fields).
4. Form fields: bind "value"/"checked" to a data path, e.g. "value": { "$bind": "form.email" }; the UI keeps it in sync.
5. Interactivity is declarative. Event props (onClick, onChange, onInput, onTabChange, onClose) hold an action or a list of actions. Action kinds: ${ACTION_KINDS.join(", ")}.
   - { "do": "setData", "path": "a.b", "value": <value or $bind> }
   - { "do": "toggle", "path": "a.b" }  (booleans, e.g. open/close a dialog)
   - { "do": "navigate", "to": "/relative-or-https-url" }
   - { "do": "emit", "name": "event_name", "payload": { ... } }  (sends an event back to you)
   - { "do": "submit", "name": "event_name", "from": "form" }  (sends the data at that path back to you)
   Inside action values "$event" holds event details, e.g. { "$bind": "$event.value" }.
6. URLs must be relative or http(s)/mailto/tel. Never use javascript: or data: URLs.
7. Keep it compact: no decorative wrappers, no more nodes than needed (max depth 64, max 5000 nodes).
8. If the tools are available, call the validator and fix every reported error before answering.

# Components
${componentCatalogue(options.registry)}${shots}`;
};

// ---------------------------------------------------------------------------
// Tool definitions for common LLM APIs
// ---------------------------------------------------------------------------

const documentSchema = {
    type: "object",
    description: "A GenUI document.",
    properties: {
        version: { type: "string", description: `Protocol version, "${PROTOCOL_VERSION}".` },
        data: { type: "object", description: "Initial data model referenced by $bind/$tpl." },
        root: { type: "object", description: 'Root node: { t, id?, p?, c? }.' },
    },
    required: ["version", "root"],
};

export type ToolSpec = { name: string; description: string; inputSchema: Record<string, unknown> };

/** Provider-neutral tool specs; the helpers below reshape them. */
export const TOOLS: ToolSpec[] = [
    {
        name: "render_ui",
        description: "Show a user interface to the user. Call this instead of replying with text when a dashboard, form, table, chart or workflow is the better answer.",
        inputSchema: { type: "object", properties: { document: documentSchema }, required: ["document"] },
    },
    {
        name: "validate_ui",
        description: "Validate a GenUI document and return a list of errors to fix. Call before render_ui.",
        inputSchema: { type: "object", properties: { document: documentSchema }, required: ["document"] },
    },
    {
        name: "patch_ui",
        description: "Update the UI that is already on screen with RFC 6902 patch operations (paths like /c/0/p/label), and/or data patches (paths like /metrics/users).",
        inputSchema: {
            type: "object",
            properties: {
                patches: { type: "array", items: { type: "object" }, description: "Node patches: { op, path, value?, from? }." },
                dataPatches: { type: "array", items: { type: "object" }, description: "Patches over the data model." },
            },
        },
    },
];

export const toAnthropicTools = (tools: ToolSpec[] = TOOLS) => tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
export const toOpenAITools = (tools: ToolSpec[] = TOOLS) =>
    tools.map((t) => ({ type: "function" as const, function: { name: t.name, description: t.description, parameters: t.inputSchema } }));
export const toMcpTools = (tools: ToolSpec[] = TOOLS) => tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
