import type { ASTDocument, UINode } from "@genui-protocol/ast";
import { defaultASTDocument } from "@genui-protocol/ast";
import type { ComponentRegistry, RegistryEntry } from "@genui-protocol/component-registry";
import { validateDocument, validateNode, type ValidationResult } from "@genui-protocol/validation";

export const RENDERERS = ["react", "angular", "vue", "svelte", "react-native", "swiftui", "flutter"];

/** Gives every node without an id a deterministic, unique one (`kpi-1`, `kpi-2`, ...). Never changes existing ids. */
export function assignMissingIds(root: UINode): UINode {
    const taken = new Set<string>();
    const collect = (n: UINode) => {
        if (n.id) taken.add(n.id);
        n.c?.forEach(collect);
    };
    collect(root);
    const counters: Record<string, number> = {};
    const visit = (n: UINode): UINode => {
        let id = n.id;
        if (!id) {
            do {
                counters[n.t] = (counters[n.t] ?? 0) + 1;
                id = `${n.t}-${counters[n.t]}`;
            } while (taken.has(id));
            taken.add(id);
        }
        const out: UINode = { ...n, id };
        if (n.c) out.c = n.c.map(visit);
        return out;
    };
    return visit(root);
}

export function astToMarkdown(node: UINode, depth = 0): string {
    const indent = "  ".repeat(depth);
    const props = node.p ? Object.entries(node.p).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ") : "";
    let md = `${indent}- **\`${node.t}\`**${props ? ` (${props})` : ""}`;
    if (node.c) md += "\n" + node.c.map((child) => astToMarkdown(child, depth + 1)).join("\n");
    return md;
}

export type AstStats = { count: number; types: Record<string, number>; maxDepth: number; usedProps: string[] };

export function astMetadata(root: UINode): AstStats {
    const stats: AstStats = { count: 0, types: {}, maxDepth: 0, usedProps: [] };
    const stack: Array<[UINode, number]> = [[root, 1]];
    while (stack.length > 0) {
        const [node, depth] = stack.pop()!;
        stats.count++;
        stats.types[node.t] = (stats.types[node.t] ?? 0) + 1;
        stats.maxDepth = Math.max(stats.maxDepth, depth);
        if (node.p) stats.usedProps.push(...Object.keys(node.p));
        node.c?.forEach((c) => stack.push([c, depth + 1]));
    }
    return stats;
}

/** Validates either a full document or a bare root node. */
export function checkAst(input: { document?: unknown; root?: unknown; renderer?: string }): ValidationResult {
    if (input.document !== undefined) return validateDocument(input.document, input.renderer);
    return validateNode(input.root, input.renderer);
}

// ---- component suggestions -------------------------------------------------

export function suggestComponents(registry: ComponentRegistry, description: string): Array<{ component: RegistryEntry; score: number }> {
    const desc = description.toLowerCase();
    const has = (...words: string[]) => words.some((w) => desc.includes(w));
    return registry
        .list()
        .map((component) => {
            const name = component.id.toLowerCase();
            const cat = component.category.toLowerCase();
            let score = 0;
            if (has("form", "input", "register", "login", "signup")) {
                if (cat === "forms") score += 3;
                if (["input", "select", "checkbox", "textarea"].includes(name)) score += 2;
                if (name === "button") score += 2;
            }
            if (has("dashboard", "overview", "metrics", "analytics")) {
                if (name === "dashboard" || name === "kpi") score += 3;
                if (name === "chart") score += 3;
                if (name === "table") score += 2;
                if (cat === "data") score += 1;
            }
            if (has("chart", "graph", "visualize")) {
                if (name === "chart") score += 3;
                if (name === "kpi") score += 1;
            }
            if (has("list", "table", "grid", "data")) {
                if (name === "table") score += 3;
                if (name === "grid") score += 2;
            }
            if (has("setting", "preference", "config")) {
                if (name === "tabs") score += 2;
                if (cat === "forms") score += 2;
            }
            if (has("chat", "message", "conversation")) {
                if (name === "text" || name === "input") score += 2;
                if (name === "flex") score += 1;
            }
            if (has("card", "section", "layout")) {
                if (name === "card" || name === "section") score += 2;
                if (["flex", "grid", "stack"].includes(name)) score += 1;
            }
            if (has("modal", "dialog", "overlay", "popup")) {
                if (name === "dialog" || name === "drawer") score += 3;
            }
            if (has("step", "workflow", "process", "pipeline")) {
                if (name === "workflow") score += 3;
                if (name === "timeline") score += 2;
            }
            if (has("agent", "trace", "execution", "graph")) {
                if (name === "executiongraph" || name === "timeline") score += 2;
            }
            if (has("navigate", "tab", "switch")) {
                if (name === "tabs") score += 3;
            }
            return { component, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score);
}

// ---- templates -------------------------------------------------------------

export const TEMPLATES: Record<string, UINode> = {
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
      { t: "input", p: { label: "Node Hostname", placeholder: "e.g. node-01", value: { $bind: "form.hostname" } } },
      { t: "select", p: { label: "Zone", value: { $bind: "form.zone" }, options: [{ label: "US-West", value: "us-w" }, { label: "EU-Central", value: "eu-c" }] } },
      { t: "input", p: { label: "Tags", placeholder: "comma-separated", value: { $bind: "form.tags" } } },
      { t: "checkbox", p: { label: "Enable monitoring", checked: { $bind: "form.monitoring" } } },
      { t: "button", p: { label: "Create Node", variant: "default", onClick: { do: "submit", name: "create_node", from: "form" } } },
    ],
  },
  analytics: {
    t: "page",
    p: { title: "Analytics Overview", subtitle: "Real-time metrics" },
    c: [
      { t: "grid", p: { cols: 4, gap: 16 }, c: [
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
      { t: "flex", p: { gap: 8, justify: "end" }, c: [
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

/** Initial data models for templates that use `$bind`. */
export const TEMPLATE_DATA: Record<string, Record<string, unknown>> = {
    form: { form: { hostname: "", zone: "us-w", tags: "", monitoring: true } },
};

export function buildTemplate(type: string): ASTDocument | null {
    const root = TEMPLATES[type];
    if (!root) return null;
    const doc = defaultASTDocument(assignMissingIds(JSON.parse(JSON.stringify(root)) as UINode));
    const data = TEMPLATE_DATA[type];
    return data ? { ...doc, data: JSON.parse(JSON.stringify(data)) } : doc;
}
