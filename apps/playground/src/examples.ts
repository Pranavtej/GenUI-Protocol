import type { ASTDocument } from "@genui-protocol/ast";

export const EXAMPLES: Record<string, ASTDocument> = {
    "Dashboard (data-bound)": {
        version: "1.0.0",
        data: { metrics: { users: "12,847", revenue: "$94,201" }, traffic: [{ label: "Mon", value: 100 }, { label: "Tue", value: 140 }, { label: "Wed", value: 120 }] },
        root: {
            t: "page",
            p: { title: "Overview", subtitle: "Live metrics" },
            c: [
                { t: "grid", p: { cols: 2 }, c: [
                    { t: "kpi", id: "users", p: { label: "Users", value: { $bind: "metrics.users" }, trend: "up", trendValue: "+12%" } },
                    { t: "kpi", id: "revenue", p: { label: "Revenue", value: { $bind: "metrics.revenue" }, trend: "up", trendValue: "+8%" } },
                ] },
                { t: "chart", p: { type: "bar", title: "Daily traffic", data: { $bind: "traffic" } } },
            ],
        },
    },
    "Signup form (actions)": {
        version: "1.0.0",
        data: { form: { name: "", plan: "pro", terms: false } },
        root: {
            t: "card",
            p: { title: "Create account" },
            c: [
                { t: "input", id: "name", p: { label: "Name", value: { $bind: "form.name" } } },
                { t: "select", id: "plan", p: { label: "Plan", value: { $bind: "form.plan" }, options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] } },
                { t: "checkbox", id: "terms", p: { label: "I accept the terms", checked: { $bind: "form.terms" } } },
                { t: "text", p: { content: { $tpl: "Signing up {{form.name}} on the {{form.plan}} plan" }, color: "muted" } },
                { t: "button", id: "go", p: { label: "Sign up", onClick: { do: "submit", name: "signup", from: "form" } } },
            ],
        },
    },
    "Agent run (workflow + timeline)": {
        version: "1.0.0",
        root: {
            t: "page",
            p: { title: "Agent run #482" },
            c: [
                { t: "workflow", p: { steps: [{ id: "1", name: "Fetch data", status: "completed", duration: "1.2s" }, { id: "2", name: "Transform", status: "active" }, { id: "3", name: "Render UI", status: "pending" }] } },
                { t: "executionGraph", p: { nodes: [{ id: "n1", label: "Query", type: "input", status: "success" }, { id: "n2", label: "Reasoning", type: "process", status: "running" }, { id: "n3", label: "UI", type: "output", status: "idle" }], edges: [{ source: "n1", target: "n2" }, { source: "n2", target: "n3" }] } },
                { t: "timeline", p: { items: [{ title: "Started", date: "10:00", status: "completed" }, { title: "Tool call", date: "10:02", description: "discover_components", status: "current" }] } },
            ],
        },
    },
};
