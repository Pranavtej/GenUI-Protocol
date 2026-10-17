import type { ASTDocument } from "@genui-protocol/ast";
import type { StreamFrame } from "@genui-protocol/protocol";
import { actions, bind, document, tpl, ui } from "@genui-protocol/sdk-js";

/** What a (scripted) agent sends back in answer to an `emit` / `submit` event from the UI. */
export type AgentReply = (event: { name: string; payload: Record<string, unknown> }) => StreamFrame[];

export type Example = {
    id: string;
    title: string;
    description: string;
    document: ASTDocument;
    /** Frames a live agent would stream after the initial document (sequenced from 2; the document is frame 1). */
    live?: StreamFrame[];
    /** Scripted agent: no LLM needed to see the full UI -> agent -> UI loop. */
    reply?: AgentReply;
};

// ---------------------------------------------------------------------------
// 1. Analytics dashboard: data binding, tabs, charts, a table and an export dialog.
// ---------------------------------------------------------------------------

const analytics: Example = {
    id: "analytics-dashboard",
    title: "Analytics dashboard",
    description: "KPIs, tabs with charts and a table, all bound to one data model. Choose a range and the title follows; the export dialog emits an event.",
    document: document(
        ui.page({ title: tpl("Analytics — {{range}}"), subtitle: "Data-bound: the document holds no numbers, the data model does" },
            ui.select({ id: "range", label: "Range", value: bind("range"), options: [{ label: "Last 7 days", value: "7d" }, { label: "Last 30 days", value: "30d" }] }),
            ui.grid({ cols: 4 },
                ui.kpi({ id: "k-views", label: "Page views", value: bind("kpis.views"), trend: "up", trendValue: bind("kpis.viewsDelta") }),
                ui.kpi({ id: "k-bounce", label: "Bounce rate", value: bind("kpis.bounce"), trend: "down", trendValue: "-2%" }),
                ui.kpi({ id: "k-session", label: "Avg. session", value: bind("kpis.session") }),
                ui.kpi({ id: "k-conv", label: "Conversions", value: bind("kpis.conversions"), trend: "up", trendValue: "+24%" })),
            ui.tabs({ id: "views", items: [{ label: "Traffic", value: "traffic" }, { label: "Sources", value: "sources" }, { label: "Recent", value: "recent" }] },
                ui.chart({ id: "traffic", type: "line", title: "Daily traffic", data: bind("traffic") }),
                ui.chart({ id: "sources", type: "pie", title: "Traffic sources", data: bind("sources") }),
                ui.table({ id: "recent", columns: [{ header: "Event", accessor: "event" }, { header: "Source", accessor: "source" }, { header: "When", accessor: "when" }], data: bind("recent") })),
            ui.button({ id: "export", label: "Export…", variant: "outline", onClick: actions.setData("ui.exportOpen", true) }),
            ui.dialog({ id: "export-dialog", title: "Export report", description: "Send this report to your agent.", open: bind("ui.exportOpen"), onClose: actions.setData("ui.exportOpen", false) },
                ui.button({ label: "Email me a PDF", onClick: [actions.emit("export_report", { format: "pdf" }), actions.setData("ui.exportOpen", false)] }))),
        {
            range: "7d",
            ui: { exportOpen: false },
            kpis: { views: "84,203", viewsDelta: "+12%", bounce: "32.1%", session: "4m 32s", conversions: "2,847" },
            traffic: [{ label: "Mon", value: 100 }, { label: "Tue", value: 140 }, { label: "Wed", value: 120 }, { label: "Thu", value: 180 }, { label: "Fri", value: 160 }],
            sources: [{ label: "Organic", value: 45 }, { label: "Direct", value: 30 }, { label: "Referral", value: 15 }, { label: "Social", value: 10 }],
            recent: [{ event: "Signup", source: "Organic", when: "2m ago" }, { event: "Payment", source: "Direct", when: "5m ago" }, { event: "Upgrade", source: "Referral", when: "12m ago" }],
        }
    ),
    live: [
        { type: "data", sequence: 2, patches: [{ op: "replace", path: "/kpis/views", value: "84,611" }, { op: "add", path: "/traffic/-", value: { label: "Sat", value: 90 } }] },
        { type: "data", sequence: 3, patches: [{ op: "add", path: "/recent/0", value: { event: "Signup", source: "Social", when: "just now" } }] },
    ],
    reply: ({ name, payload }) =>
        name === "export_report"
            ? [{ type: "data", patches: [{ op: "add", path: "/recent/0", value: { event: `Export (${String(payload["format"])}) queued`, source: "You", when: "just now" } }] }]
            : [],
};

// ---------------------------------------------------------------------------
// 2. Access-request workflow: a form that submits to the agent, which drives a workflow.
// ---------------------------------------------------------------------------

const workflowSteps = (statuses: [string, string, string]) => [
    { id: "1", name: "Request submitted", status: statuses[0] },
    { id: "2", name: "Manager approval", status: statuses[1] },
    { id: "3", name: "Access granted", status: statuses[2] },
];

const onboarding: Example = {
    id: "access-request",
    title: "Access request workflow",
    description: "A form bound to the data model. Submit sends the values to the agent; the agent answers with data patches that advance the workflow.",
    document: document(
        ui.page({ title: "Request access", subtitle: tpl("Status: {{status}}") },
            ui.card({ title: "Your request" },
                ui.input({ id: "who", label: "Your name", value: bind("form.name") }),
                ui.select({ id: "system", label: "System", value: bind("form.system"), options: [{ label: "Billing", value: "billing" }, { label: "Analytics", value: "analytics" }, { label: "Admin console", value: "admin" }] }),
                ui.textarea({ id: "why", label: "Why do you need it?", value: bind("form.reason"), rows: 3 }),
                ui.checkbox({ id: "ack", label: "I have completed security training", checked: bind("form.ack") }),
                ui.button({ id: "submit", label: "Request access", onClick: actions.submit("request_access", "form") })),
            ui.workflow({ id: "progress", steps: bind("steps") })),
        { status: "draft", form: { name: "", system: "billing", reason: "", ack: false }, steps: workflowSteps(["pending", "pending", "pending"]) }
    ),
    live: [],
    reply: ({ name, payload }) => {
        if (name !== "request_access") return [];
        const form = (payload["data"] ?? {}) as { name?: string; ack?: boolean };
        if (!form.ack || !form.name) {
            return [{ type: "data", patches: [{ op: "replace", path: "/status", value: "Please enter your name and confirm the training." }] }];
        }
        return [
            { type: "data", patches: [{ op: "replace", path: "/status", value: `submitted for ${form.name}` }, { op: "replace", path: "/steps", value: workflowSteps(["completed", "active", "pending"]) }] },
            { type: "data", patches: [{ op: "replace", path: "/status", value: "approved" }, { op: "replace", path: "/steps", value: workflowSteps(["completed", "completed", "completed"]) }] },
        ];
    },
};

// ---------------------------------------------------------------------------
// 3. Agent monitoring: the use case from the project brief.
// ---------------------------------------------------------------------------

const graphNodes = (a: string, b: string, c: string, d: string) => [
    { id: "q", label: "Query", type: "input", status: a },
    { id: "r", label: "Reasoning", type: "process", status: b },
    { id: "t", label: "Tool: search", type: "process", status: c },
    { id: "a", label: "Answer", type: "output", status: d },
];

const monitoring: Example = {
    id: "agent-monitoring",
    title: "Agent run monitor",
    description: "An execution graph, timeline and counters for a running agent. Press “Play stream” to watch frames arrive in order, like a real SSE feed.",
    document: document(
        ui.dashboard({ title: tpl("Run {{run.id}} — {{run.state}}") },
            ui.kpi({ id: "k-tokens", label: "Tokens", value: bind("run.tokens") }),
            ui.kpi({ id: "k-latency", label: "Latency", value: bind("run.latency") }),
            ui.kpi({ id: "k-tools", label: "Tool calls", value: bind("run.toolCalls") }),
            ui.executionGraph({ id: "graph", nodes: bind("run.graph"), edges: [{ source: "q", target: "r" }, { source: "r", target: "t" }, { source: "t", target: "a" }] }),
            ui.timeline({ id: "events", items: bind("run.events") })),
        {
            run: {
                id: "482", state: "running", tokens: "1,204", latency: "1.8s", toolCalls: "1",
                graph: graphNodes("success", "success", "running", "idle"),
                events: [{ title: "Run started", date: "10:00:00", status: "completed" }, { title: "Tool call: search", date: "10:00:02", status: "current" }],
            },
        }
    ),
    live: [
        { type: "data", sequence: 2, patches: [{ op: "replace", path: "/run/tokens", value: "2,310" }, { op: "replace", path: "/run/toolCalls", value: "2" }] },
        { type: "data", sequence: 3, patches: [{ op: "replace", path: "/run/graph", value: graphNodes("success", "success", "success", "running") }, { op: "add", path: "/run/events/-", value: { title: "Tool result received", date: "10:00:05", status: "completed" } }] },
        { type: "data", sequence: 4, patches: [{ op: "replace", path: "/run/state", value: "finished" }, { op: "replace", path: "/run/latency", value: "4.2s" }, { op: "replace", path: "/run/graph", value: graphNodes("success", "success", "success", "success") }, { op: "add", path: "/run/events/-", value: { title: "Answer sent", date: "10:00:06", status: "completed" } }] },
    ],
};

export const EXAMPLES: Record<string, Example> = {
    [analytics.id]: analytics,
    [onboarding.id]: onboarding,
    [monitoring.id]: monitoring,
};

export const EXAMPLE_LIST: Example[] = Object.values(EXAMPLES);
