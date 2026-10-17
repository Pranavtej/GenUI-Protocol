import type { ASTDocument, UINode } from "@genui-protocol/ast";
import { actions, bind, document, tpl, ui } from "@genui-protocol/sdk-js";

export type Task = {
    id: string;
    prompt: string;
    /** Component types the answer must use. */
    mustUse: string[];
    /** The answer must use data binding (`$bind`/`$tpl`) / at least one action prop. */
    needsBinding?: boolean;
    needsAction?: boolean;
    /** A known-good answer: proves the checks are satisfiable and powers `--mock`. */
    reference: ASTDocument;
};

const kpis = [["Revenue", "$94,201"], ["Users", "12,847"], ["Churn", "2.1%"]];

export const TASKS: Task[] = [
    {
        id: "kpi-dashboard",
        prompt: "Show a dashboard with three KPIs: revenue ($94,201), active users (12,847) and churn (2.1%).",
        mustUse: ["kpi"],
        reference: document(ui.dashboard({ title: "KPIs" }, ...kpis.map(([label, value]) => ui.kpi({ label, value })))),
    },
    {
        id: "chart-bound",
        prompt: "Plot weekly signups as a bar chart: Mon 40, Tue 55, Wed 38, Thu 70, Fri 64.",
        mustUse: ["chart"],
        needsBinding: true,
        reference: document(
            ui.page({ title: "Weekly signups" }, ui.chart({ type: "bar", data: bind("signups") })),
            { signups: [{ label: "Mon", value: 40 }, { label: "Tue", value: 55 }, { label: "Wed", value: 38 }, { label: "Thu", value: 70 }, { label: "Fri", value: 64 }] }
        ),
    },
    {
        id: "table",
        prompt: "List our top 3 customers with name and monthly spend: Acme $4,200, Globex $3,900, Initech $2,750.",
        mustUse: ["table"],
        reference: document(ui.table({ columns: [{ header: "Customer", accessor: "name" }, { header: "Spend", accessor: "spend" }], data: [{ name: "Acme", spend: "$4,200" }, { name: "Globex", spend: "$3,900" }, { name: "Initech", spend: "$2,750" }] })),
    },
    {
        id: "signup-form",
        prompt: "Build a signup form with name, email and a plan selector (free/pro). When submitted, send the values to me.",
        mustUse: ["input", "select", "button"],
        needsBinding: true,
        needsAction: true,
        reference: document(
            ui.card({ title: "Sign up" },
                ui.input({ label: "Name", value: bind("form.name") }),
                ui.input({ label: "Email", type: "email", value: bind("form.email") }),
                ui.select({ label: "Plan", value: bind("form.plan"), options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] }),
                ui.button({ label: "Sign up", onClick: actions.submit("signup", "form") })),
            { form: { name: "", email: "", plan: "free" } }
        ),
    },
    {
        id: "deploy-workflow",
        prompt: "Show my deployment pipeline: build (done, 42s), test (running), release (waiting).",
        mustUse: ["workflow"],
        reference: document(ui.workflow({ steps: [{ id: "1", name: "Build", status: "completed", duration: "42s" }, { id: "2", name: "Test", status: "active" }, { id: "3", name: "Release", status: "pending" }] })),
    },
    {
        id: "settings-tabs",
        prompt: "A settings page with tabs for General and Notifications. General has a display-name field; Notifications has an email-alerts checkbox.",
        mustUse: ["tabs", "input", "checkbox"],
        reference: document(
            ui.page({ title: "Settings" },
                ui.tabs({ items: [{ label: "General", value: "general" }, { label: "Notifications", value: "notifications" }] },
                    ui.input({ label: "Display name", value: bind("settings.name") }),
                    ui.checkbox({ label: "Email alerts", checked: bind("settings.alerts") }))),
            { settings: { name: "", alerts: true } }
        ),
    },
    {
        id: "confirm-dialog",
        prompt: "A 'Delete project' button that opens a confirmation dialog with Cancel and Delete buttons. Delete should notify me.",
        mustUse: ["button", "dialog"],
        needsBinding: true,
        needsAction: true,
        reference: document(
            ui.stack({},
                ui.button({ label: "Delete project", variant: "destructive", onClick: actions.setData("ui.confirm", true) }),
                ui.dialog({ title: "Delete project?", open: bind("ui.confirm"), onClose: actions.setData("ui.confirm", false) },
                    ui.button({ label: "Cancel", variant: "outline", onClick: actions.setData("ui.confirm", false) }),
                    ui.button({ label: "Delete", variant: "destructive", onClick: [actions.emit("delete_project"), actions.setData("ui.confirm", false)] }))),
            { ui: { confirm: false } }
        ),
    },
    {
        id: "live-counter",
        prompt: "Show the text 'Items in cart: N' where N comes from data (start at 3), with a button that adds one... or if you can't compute, a button that sets it to 4.",
        mustUse: ["text", "button"],
        needsBinding: true,
        needsAction: true,
        reference: document(
            ui.card({ title: "Cart" }, ui.text({ content: tpl("Items in cart: {{cart.count}}") }), ui.button({ label: "Set to 4", onClick: actions.setData("cart.count", 4) })),
            { cart: { count: 3 } }
        ),
    },
    {
        id: "agent-trace",
        prompt: "Visualise an agent run: query → reasoning → tool call → answer, with the tool call currently running.",
        mustUse: ["executionGraph"],
        reference: document(ui.executionGraph({
            nodes: [{ id: "q", label: "Query", type: "input", status: "success" }, { id: "r", label: "Reasoning", type: "process", status: "success" }, { id: "t", label: "Tool call", type: "process", status: "running" }, { id: "a", label: "Answer", type: "output", status: "idle" }],
            edges: [{ source: "q", target: "r" }, { source: "r", target: "t" }, { source: "t", target: "a" }],
        })),
    },
    {
        id: "incident-timeline",
        prompt: "Show an incident timeline: 10:00 alert fired, 10:05 on-call acknowledged, 10:30 fix deployed (current).",
        mustUse: ["timeline"],
        reference: document(ui.timeline({ items: [{ title: "Alert fired", date: "10:00", status: "completed" }, { title: "Acknowledged", date: "10:05", status: "completed" }, { title: "Fix deployed", date: "10:30", status: "current" }] })),
    },
];

export const allTypes = (node: UINode, into = new Set<string>()): Set<string> => {
    into.add(node.t);
    node.c?.forEach((c) => allTypes(c, into));
    return into;
};

export const countNodes = (node: UINode): number => 1 + (node.c?.reduce((n, c) => n + countNodes(c), 0) ?? 0);

const walkProps = (node: UINode, visit: (key: string, value: unknown) => void) => {
    for (const [k, v] of Object.entries(node.p ?? {})) visit(k, v);
    node.c?.forEach((c) => walkProps(c, visit));
};

const containsExpression = (v: unknown): boolean =>
    typeof v === "object" && v !== null && ("$bind" in v || "$tpl" in v || Object.values(v).some(containsExpression));

/** Does the document satisfy the task's feature requirements? Returns the failures (empty = satisfied). */
export const checkFeatures = (task: Task, doc: ASTDocument): string[] => {
    const failures: string[] = [];
    const types = allTypes(doc.root);
    for (const t of task.mustUse) if (!types.has(t)) failures.push(`missing component "${t}"`);
    let bound = false;
    let acted = false;
    walkProps(doc.root, (k, v) => {
        if (containsExpression(v)) bound = true;
        if (/^on[A-Z]/.test(k)) acted = true;
    });
    if (task.needsBinding && !bound) failures.push("does not use data binding ($bind/$tpl)");
    if (task.needsAction && !acted) failures.push("does not use any action prop (onClick, ...)");
    return failures;
};
