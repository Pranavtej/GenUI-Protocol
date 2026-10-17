import type { ASTDocument, UINode } from "@genui-protocol/ast";
import { PROTOCOL_VERSION, type Action, type BindExpr, type TemplateExpr } from "@genui-protocol/protocol";

/** A prop value, or a data-binding expression that resolves to one. */
export type Bindable<T> = T | BindExpr | TemplateExpr;
export type ActionProp = Action | Action[];
export type Child = UINode | false | null | undefined;

const node = (t: string, p: Record<string, unknown> | undefined, children?: Child[], id?: string): UINode => {
    const out: UINode = { t };
    if (id) out.id = id;
    if (p) {
        const clean = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined));
        if (Object.keys(clean).length > 0) out.p = clean;
    }
    const kids = children?.filter((c): c is UINode => Boolean(c));
    if (kids && kids.length > 0) out.c = kids;
    return out;
};

/** Escape hatch for custom (`vendor:name`) components. */
export const custom = (type: string, props?: Record<string, unknown>, children?: Child[]): UINode => node(type, props, children);

// ---- expressions -----------------------------------------------------------

/** `{ $bind: path }` — resolves to the value at `path` in the data model. */
export const bind = (path: string, defaultValue?: unknown): BindExpr => (defaultValue === undefined ? { $bind: path } : { $bind: path, default: defaultValue });
/** `{ $tpl: "Hello {{user.name}}" }` */
export const tpl = (template: string): TemplateExpr => ({ $tpl: template });

// ---- actions ---------------------------------------------------------------

export const actions = {
    setData: (path: string, value: unknown): Action => ({ do: "setData", path, value }),
    toggle: (path: string): Action => ({ do: "toggle", path }),
    navigate: (to: string): Action => ({ do: "navigate", to }),
    emit: (name: string, payload?: Record<string, unknown>): Action => (payload ? { do: "emit", name, payload } : { do: "emit", name }),
    submit: (name: string, from: string): Action => ({ do: "submit", name, from }),
};

// ---- components ------------------------------------------------------------

type Common = { id?: string };
const withId = <P extends Common>(t: string, props: P, children?: Child[]) => {
    const { id, ...rest } = props;
    return node(t, rest, children, id);
};

export const ui = {
    page: (props: Common & { title: Bindable<string>; subtitle?: Bindable<string> }, ...children: Child[]) => withId("page", props, children),
    section: (props: Common & { title?: Bindable<string>; description?: Bindable<string>; border?: boolean } = {}, ...children: Child[]) => withId("section", props, children),
    card: (props: Common & { title?: Bindable<string>; subtitle?: Bindable<string>; bordered?: boolean } = {}, ...children: Child[]) => withId("card", props, children),
    grid: (props: Common & { cols?: number; gap?: number } = {}, ...children: Child[]) => withId("grid", props, children),
    flex: (props: Common & { direction?: "row" | "col"; align?: "start" | "center" | "end" | "stretch"; justify?: "start" | "center" | "between" | "end"; gap?: number } = {}, ...children: Child[]) => withId("flex", props, children),
    stack: (props: Common & { direction?: "vertical" | "horizontal"; gap?: number } = {}, ...children: Child[]) => withId("stack", props, children),
    dashboard: (props: Common & { title: Bindable<string>; layout?: "grid" | "flex" }, ...children: Child[]) => withId("dashboard", props, children),

    text: (props: Common & { content: Bindable<string | number>; size?: "xs" | "sm" | "base" | "lg" | "xl"; color?: "default" | "muted" | "primary" | "success" | "warning" | "danger"; bold?: boolean }) => withId("text", props),
    heading: (props: Common & { text: Bindable<string>; level?: 1 | 2 | 3 | 4 | 5 | 6 }) => withId("heading", props),

    button: (props: Common & { label: Bindable<string>; variant?: "default" | "outline" | "secondary" | "ghost" | "destructive"; size?: "sm" | "default" | "lg"; disabled?: Bindable<boolean>; onClick?: ActionProp }) => withId("button", props),
    input: (props: Common & { label?: Bindable<string>; placeholder?: string; value?: Bindable<string>; type?: "text" | "email" | "password" | "number"; disabled?: Bindable<boolean>; onChange?: ActionProp; onInput?: ActionProp }) => withId("input", props),
    textarea: (props: Common & { label?: Bindable<string>; placeholder?: string; value?: Bindable<string>; rows?: number; disabled?: Bindable<boolean>; onChange?: ActionProp }) => withId("textarea", props),
    select: (props: Common & { label?: Bindable<string>; options: Bindable<Array<{ label: string; value: string }>>; value?: Bindable<string>; disabled?: Bindable<boolean>; onChange?: ActionProp }) => withId("select", props),
    checkbox: (props: Common & { label: Bindable<string>; checked?: Bindable<boolean>; disabled?: Bindable<boolean>; onChange?: ActionProp }) => withId("checkbox", props),

    table: (props: Common & { columns: Array<{ header: string; accessor: string }>; data: Bindable<Array<Record<string, unknown>>> }) => withId("table", props),
    chart: (props: Common & { type: "line" | "bar" | "pie"; data: Bindable<Array<{ label: string; value: number }>>; height?: number; colorScheme?: "default" | "emerald" | "rose" | "amber"; title?: string }) => withId("chart", props),
    kpi: (props: Common & { label: Bindable<string>; value: Bindable<string | number>; subtext?: Bindable<string>; trend?: "up" | "down" | "flat"; trendValue?: Bindable<string> }) => withId("kpi", props),

    tabs: (props: Common & { items: Array<{ label: string; value: string }>; activeTab?: Bindable<string>; onTabChange?: ActionProp }, ...children: Child[]) => withId("tabs", props, children),
    dialog: (props: Common & { title: Bindable<string>; open?: Bindable<boolean>; description?: Bindable<string>; onClose?: ActionProp }, ...children: Child[]) => withId("dialog", props, children),
    drawer: (props: Common & { title: Bindable<string>; open?: Bindable<boolean>; position?: "left" | "right"; onClose?: ActionProp }, ...children: Child[]) => withId("drawer", props, children),

    workflow: (props: Common & { steps: Bindable<Array<{ id: string; name: string; status: "completed" | "active" | "pending" | "failed"; duration?: string }>> }) => withId("workflow", props),
    timeline: (props: Common & { items: Bindable<Array<{ title: string; date: string; description?: string; status?: "completed" | "current" | "upcoming" }>> }) => withId("timeline", props),
    executionGraph: (props: Common & { nodes: Bindable<Array<{ id: string; label: string; type?: string; status?: string }>>; edges: Bindable<Array<{ from: string; to: string }>> }) => withId("executionGraph", props),
};

/** Builds a document. `data` is the initial data model referenced by `bind`/`tpl`. */
export const document = (root: UINode, data?: Record<string, unknown>): ASTDocument => (data ? { version: PROTOCOL_VERSION, data, root } : { version: PROTOCOL_VERSION, root });
