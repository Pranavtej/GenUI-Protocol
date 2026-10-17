import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { RuntimeNode, RuntimeSession } from "@genui-protocol/runtime-core";

export type ComponentProps = {
    node: RuntimeNode;
    /** Props with `$bind` / `$tpl` already resolved. */
    props: Record<string, any>;
    children: ReactNode;
    session: RuntimeSession;
};

const v = (name: string) => `var(--genui-${name})`;

const attrs = (node: RuntimeNode) => ({ "data-genui-type": node.t, "data-genui-id": node.id });

const str = (x: unknown, fallback = ""): string => (x === undefined || x === null ? fallback : typeof x === "object" ? JSON.stringify(x) : String(x));
const num = (x: unknown, fallback: number): number => (typeof x === "number" && Number.isFinite(x) ? x : fallback);
const arr = <T = any,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

const surface: CSSProperties = {
    background: v("color-surface"),
    border: `1px solid ${v("color-border")}`,
    borderRadius: v("radius-md"),
    boxShadow: v("shadow-card"),
};

const gapOf = (g: unknown, fallback: number) => `${num(g, fallback)}px`;

// ---- layout ----------------------------------------------------------------

export const Page = ({ node, props, children }: ComponentProps) => (
    <main {...attrs(node)} style={{ padding: v("space-lg"), minHeight: "100%", background: v("color-background"), color: v("color-text") }}>
        <header style={{ marginBottom: v("space-md") }}>
            <h1 style={{ margin: 0, fontSize: v("font-size-xl") }}>{str(props.title)}</h1>
            {props.subtitle ? <p style={{ margin: "4px 0 0", color: v("color-text-muted") }}>{str(props.subtitle)}</p> : null}
        </header>
        <div style={{ display: "flex", flexDirection: "column", gap: v("space-lg") }}>{children}</div>
    </main>
);

export const Section = ({ node, props, children }: ComponentProps) => (
    <section {...attrs(node)} style={props.border === true ? { ...surface, padding: v("space-md") } : undefined}>
        {props.title ? <h2 style={{ fontSize: v("font-size-lg"), margin: "0 0 4px" }}>{str(props.title)}</h2> : null}
        {props.description ? <p style={{ margin: "0 0 8px", color: v("color-text-muted") }}>{str(props.description)}</p> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: v("space-md") }}>{children}</div>
    </section>
);

export const Card = ({ node, props, children }: ComponentProps) => (
    <div {...attrs(node)} style={{ ...surface, padding: v("space-md"), border: props.bordered === false ? "none" : surface.border }}>
        {props.title ? <h3 style={{ margin: 0, fontSize: v("font-size-lg") }}>{str(props.title)}</h3> : null}
        {props.subtitle ? <p style={{ margin: "2px 0 8px", color: v("color-text-muted"), fontSize: v("font-size-sm") }}>{str(props.subtitle)}</p> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: v("space-md") }}>{children}</div>
    </div>
);

export const Grid = ({ node, props, children }: ComponentProps) => (
    <div {...attrs(node)} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(12, num(props.cols, 2)))}, minmax(0, 1fr))`, gap: gapOf(props.gap, 16) }}>
        {children}
    </div>
);

const JUSTIFY: Record<string, string> = { start: "flex-start", center: "center", between: "space-between", end: "flex-end" };
const ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };

export const Flex = ({ node, props, children }: ComponentProps) => (
    <div
        {...attrs(node)}
        style={{
            display: "flex",
            flexDirection: props.direction === "col" ? "column" : "row",
            alignItems: ALIGN[str(props.align)] ?? "stretch",
            justifyContent: JUSTIFY[str(props.justify)] ?? "flex-start",
            gap: gapOf(props.gap, 8),
        }}
    >
        {children}
    </div>
);

export const Stack = ({ node, props, children }: ComponentProps) => (
    <div {...attrs(node)} style={{ display: "flex", flexDirection: props.direction === "horizontal" ? "row" : "column", gap: gapOf(props.gap, 12) }}>
        {children}
    </div>
);

export const Dashboard = ({ node, props, children }: ComponentProps) => (
    <div {...attrs(node)}>
        {props.title ? <h2 style={{ margin: "0 0 12px", fontSize: v("font-size-xl") }}>{str(props.title)}</h2> : null}
        <div
            style={
                props.layout === "flex"
                    ? { display: "flex", flexWrap: "wrap", gap: v("space-md") }
                    : { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: v("space-md") }
            }
        >
            {children}
        </div>
    </div>
);

// ---- text ------------------------------------------------------------------

const TEXT_COLOR: Record<string, string> = {
    default: v("color-text"), muted: v("color-text-muted"), primary: v("color-primary"),
    success: v("color-success"), warning: v("color-warning"), danger: v("color-danger"),
};

export const Text = ({ node, props }: ComponentProps) => (
    <p {...attrs(node)} style={{ margin: 0, fontSize: v(`font-size-${["xs", "sm", "base", "lg", "xl"].includes(str(props.size)) ? str(props.size) : "base"}`), color: TEXT_COLOR[str(props.color, "default")] ?? TEXT_COLOR.default, fontWeight: props.bold === true ? 600 : 400 }}>
        {str(props.content)}
    </p>
);

export const Heading = ({ node, props }: ComponentProps) => {
    const level = Math.max(1, Math.min(6, num(props.level, 2)));
    const Tag = `h${level}` as "h1";
    return <Tag {...attrs(node)} style={{ margin: 0 }}>{str(props.text)}</Tag>;
};

// ---- inputs ----------------------------------------------------------------

const controlStyle: CSSProperties = {
    font: "inherit", padding: "8px 10px", borderRadius: v("radius-md"), border: `1px solid ${v("color-border")}`,
    background: v("color-background"), color: v("color-text"), width: "100%", boxSizing: "border-box",
};

/** Controlled when the prop is `$bind`-ed to the data model, otherwise local state seeded from the prop. */
const useField = <T,>(node: RuntimeNode, session: RuntimeSession, prop: string, resolved: unknown, fallback: T) => {
    const [local, setLocal] = useState<T>((resolved as T) ?? fallback);
    const bound = session.getBinding(node, prop) !== null;
    const value = (bound ? (resolved as T) ?? fallback : local) as T;
    const set = (next: T) => {
        if (bound) session.setBound(node, prop, next);
        else setLocal(next);
    };
    return [value, set] as const;
};

export const Button = ({ node, props, children, session }: ComponentProps) => {
    const variant = str(props.variant, "default");
    const style: CSSProperties = {
        font: "inherit", cursor: props.disabled ? "not-allowed" : "pointer", opacity: props.disabled ? 0.5 : 1,
        padding: props.size === "sm" ? "4px 10px" : props.size === "lg" ? "12px 22px" : "8px 16px",
        borderRadius: v("radius-md"),
        border: variant === "outline" ? `1px solid ${v("color-border")}` : "1px solid transparent",
        background: variant === "default" ? v("color-primary") : variant === "destructive" ? v("color-danger") : variant === "secondary" ? v("color-surface-alt") : "transparent",
        color: variant === "default" || variant === "destructive" ? v("color-primary-text") : v("color-text"),
    };
    return (
        <button {...attrs(node)} type="button" disabled={props.disabled === true} style={style} onClick={() => void session.dispatch(node, "onClick")}>
            {str(props.label)}
            {children}
        </button>
    );
};

export const Input = ({ node, props, session }: ComponentProps) => {
    const id = useId();
    const [value, set] = useField<string>(node, session, "value", props.value, "");
    return (
        <div {...attrs(node)} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {props.label ? <label htmlFor={id} style={{ fontSize: v("font-size-sm") }}>{str(props.label)}</label> : null}
            <input
                id={id} style={controlStyle} type={["text", "email", "password", "number"].includes(str(props.type)) ? str(props.type) : "text"}
                placeholder={str(props.placeholder)} disabled={props.disabled === true} value={str(value)}
                onChange={(e) => {
                    set(e.target.value);
                    void session.dispatch(node, "onInput", { value: e.target.value });
                }}
                onBlur={(e) => void session.dispatch(node, "onChange", { value: e.target.value })}
            />
        </div>
    );
};

export const Textarea = ({ node, props, session }: ComponentProps) => {
    const id = useId();
    const [value, set] = useField<string>(node, session, "value", props.value, "");
    return (
        <div {...attrs(node)} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {props.label ? <label htmlFor={id} style={{ fontSize: v("font-size-sm") }}>{str(props.label)}</label> : null}
            <textarea
                id={id} style={controlStyle} rows={num(props.rows, 3)} placeholder={str(props.placeholder)} disabled={props.disabled === true} value={str(value)}
                onChange={(e) => {
                    set(e.target.value);
                    void session.dispatch(node, "onChange", { value: e.target.value });
                }}
            />
        </div>
    );
};

export const Select = ({ node, props, session }: ComponentProps) => {
    const id = useId();
    const [value, set] = useField<string>(node, session, "value", props.value, "");
    const options = arr<{ label?: unknown; value?: unknown }>(props.options);
    return (
        <div {...attrs(node)} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {props.label ? <label htmlFor={id} style={{ fontSize: v("font-size-sm") }}>{str(props.label)}</label> : null}
            <select
                id={id} style={controlStyle} disabled={props.disabled === true} value={str(value)}
                onChange={(e) => {
                    set(e.target.value);
                    void session.dispatch(node, "onChange", { value: e.target.value });
                }}
            >
                {options.map((o, i) => (
                    <option key={i} value={str(o.value)}>{str(o.label ?? o.value)}</option>
                ))}
            </select>
        </div>
    );
};

export const Checkbox = ({ node, props, session }: ComponentProps) => {
    const id = useId();
    const [checked, set] = useField<boolean>(node, session, "checked", props.checked, false);
    return (
        <div {...attrs(node)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
                id={id} type="checkbox" disabled={props.disabled === true} checked={checked === true}
                onChange={(e) => {
                    set(e.target.checked);
                    void session.dispatch(node, "onChange", { checked: e.target.checked, value: e.target.checked });
                }}
            />
            <label htmlFor={id}>{str(props.label)}</label>
        </div>
    );
};

// ---- data ------------------------------------------------------------------

export const Table = ({ node, props }: ComponentProps) => {
    const cols = arr<{ header?: unknown; accessor?: unknown }>(props.columns);
    const rows = arr<Record<string, unknown>>(props.data);
    const cell: CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${v("color-border")}` };
    return (
        <div {...attrs(node)} style={{ ...surface, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>{cols.map((c, i) => <th key={i} style={{ ...cell, color: v("color-text-muted"), fontWeight: 600 }}>{str(c.header)}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((r, ri) => (
                        <tr key={ri}>{cols.map((c, ci) => <td key={ci} style={cell}>{str((r ?? {})[str(c.accessor)])}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const Kpi = ({ node, props }: ComponentProps) => {
    const trend = str(props.trend);
    const color = trend === "up" ? v("color-success") : trend === "down" ? v("color-danger") : v("color-text-muted");
    return (
        <div {...attrs(node)} style={{ ...surface, padding: v("space-md") }}>
            <div style={{ color: v("color-text-muted"), fontSize: v("font-size-sm") }}>{str(props.label)}</div>
            <div style={{ fontSize: v("font-size-xl"), fontWeight: 700 }}>{str(props.value)}</div>
            {props.trendValue || props.subtext ? (
                <div style={{ fontSize: v("font-size-sm"), color }}>
                    {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
                    {str(props.trendValue)} {str(props.subtext)}
                </div>
            ) : null}
        </div>
    );
};

const PALETTES: Record<string, string[]> = {
    default: ["#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#d97706", "#dc2626"],
    emerald: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#047857", "#065f46"],
    rose: ["#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#be123c", "#9f1239"],
    amber: ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#b45309", "#92400e"],
};

export const Chart = ({ node, props }: ComponentProps) => {
    const type = str(props.type, "bar");
    const palette = PALETTES[str(props.colorScheme, "default")] ?? PALETTES.default;
    const data = arr<{ label?: unknown; value?: unknown }>(props.data).map((d) => ({ label: str(d.label), value: Math.max(0, Number(d.value) || 0) }));
    const height = Math.max(80, Math.min(800, num(props.height, 240)));
    const W = 400;
    const max = Math.max(1, ...data.map((d) => d.value));
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let body: ReactNode = null;

    if (type === "pie") {
        const r = Math.min(W, height) / 2 - 10;
        let angle = -Math.PI / 2;
        body = data.map((d, i) => {
            const next = angle + (d.value / total) * Math.PI * 2;
            const [cx, cy] = [W / 2, height / 2];
            const large = next - angle > Math.PI ? 1 : 0;
            const path = d.value / total >= 0.9999
                ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
                : `M ${cx} ${cy} L ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(next)} ${cy + r * Math.sin(next)} Z`;
            angle = next;
            return <path key={i} d={path} fill={palette[i % palette.length]}><title>{`${d.label}: ${d.value}`}</title></path>;
        });
    } else if (type === "line") {
        const step = data.length > 1 ? (W - 40) / (data.length - 1) : 0;
        const pts = data.map((d, i) => [20 + i * step, height - 30 - (d.value / max) * (height - 50)] as const);
        body = (
            <>
                <polyline fill="none" stroke={palette[0]} strokeWidth={2} points={pts.map((p) => p.join(",")).join(" ")} />
                {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={palette[0]}><title>{`${data[i].label}: ${data[i].value}`}</title></circle>)}
                {data.map((d, i) => <text key={i} x={pts[i][0]} y={height - 10} fontSize={10} textAnchor="middle" fill="currentColor">{d.label}</text>)}
            </>
        );
    } else {
        const bw = (W - 40) / Math.max(1, data.length);
        body = data.map((d, i) => {
            const h = (d.value / max) * (height - 50);
            return (
                <g key={i}>
                    <rect x={20 + i * bw + bw * 0.1} y={height - 30 - h} width={bw * 0.8} height={h} fill={palette[i % palette.length]}><title>{`${d.label}: ${d.value}`}</title></rect>
                    <text x={20 + i * bw + bw / 2} y={height - 10} fontSize={10} textAnchor="middle" fill="currentColor">{d.label}</text>
                </g>
            );
        });
    }

    return (
        <div {...attrs(node)} style={{ ...surface, padding: v("space-md") }}>
            {props.title ? <div style={{ fontWeight: 600, marginBottom: 8 }}>{str(props.title)}</div> : null}
            <svg role="img" aria-label={`${type} chart`} viewBox={`0 0 ${W} ${height}`} style={{ width: "100%", height: "auto", color: v("color-text-muted") }}>{body}</svg>
        </div>
    );
};

// ---- navigation / overlay --------------------------------------------------

export const Tabs = ({ node, props, children, session }: ComponentProps) => {
    const items = arr<{ label?: unknown; value?: unknown }>(props.items);
    const first = str(items[0]?.value);
    const [active, set] = useField<string>(node, session, "activeTab", props.activeTab, first);
    const kids = Array.isArray(children) ? children : children ? [children] : [];
    const activeIndex = Math.max(0, items.findIndex((i) => str(i.value) === str(active)));
    return (
        <div {...attrs(node)}>
            <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${v("color-border")}` }}>
                {items.map((item, i) => {
                    const selected = i === activeIndex;
                    return (
                        <button
                            key={i} role="tab" type="button" aria-selected={selected}
                            style={{ font: "inherit", cursor: "pointer", background: "none", border: "none", padding: "8px 14px", color: selected ? v("color-primary") : v("color-text-muted"), borderBottom: selected ? `2px solid ${v("color-primary")}` : "2px solid transparent" }}
                            onClick={() => {
                                set(str(item.value));
                                void session.dispatch(node, "onTabChange", { value: str(item.value) });
                            }}
                        >
                            {str(item.label ?? item.value)}
                        </button>
                    );
                })}
            </div>
            <div role="tabpanel" style={{ paddingTop: v("space-md") }}>{kids[activeIndex] ?? null}</div>
        </div>
    );
};

const Overlay = ({ node, props, children, session, side }: ComponentProps & { side?: "left" | "right" | "center" }) => {
    if (props.open !== true) return null;
    const panel: CSSProperties = side === "center" || !side
        ? { margin: "10vh auto 0", maxWidth: 520, borderRadius: v("radius-md") }
        : { position: "absolute", top: 0, bottom: 0, [side]: 0, width: 360, maxWidth: "90vw" };
    return (
        <div {...attrs(node)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000 }}>
            <div role="dialog" aria-modal="true" aria-label={str(props.title)} style={{ ...surface, ...panel, padding: v("space-md"), color: v("color-text") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0, fontSize: v("font-size-lg") }}>{str(props.title)}</h2>
                    <button type="button" aria-label="Close" style={{ font: "inherit", background: "none", border: "none", cursor: "pointer", color: "inherit" }} onClick={() => void session.dispatch(node, "onClose")}>✕</button>
                </div>
                {props.description ? <p style={{ color: v("color-text-muted") }}>{str(props.description)}</p> : null}
                <div style={{ display: "flex", flexDirection: "column", gap: v("space-md") }}>{children}</div>
            </div>
        </div>
    );
};

export const Dialog = (p: ComponentProps) => <Overlay {...p} side="center" />;
export const Drawer = (p: ComponentProps) => <Overlay {...p} side={p.props.position === "left" ? "left" : "right"} />;

// ---- workflow / agent observability ----------------------------------------

const STATUS_COLOR: Record<string, string> = {
    completed: v("color-success"), success: v("color-success"), active: v("color-primary"), running: v("color-primary"), current: v("color-primary"),
    pending: v("color-text-muted"), idle: v("color-text-muted"), upcoming: v("color-text-muted"), failed: v("color-danger"), error: v("color-danger"),
};
const statusColor = (s: unknown) => STATUS_COLOR[str(s)] ?? v("color-text-muted");

export const Workflow = ({ node, props }: ComponentProps) => (
    <ol {...attrs(node)} style={{ ...surface, listStyle: "none", margin: 0, padding: v("space-md"), display: "flex", flexDirection: "column", gap: 12 }}>
        {arr<Record<string, unknown>>(props.steps).map((s, i) => (
            <li key={i} data-status={str(s.status)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden style={{ width: 12, height: 12, borderRadius: "50%", background: statusColor(s.status) }} />
                <span style={{ fontWeight: 600 }}>{str(s.name)}</span>
                <span style={{ color: v("color-text-muted"), fontSize: v("font-size-sm") }}>{str(s.status)}{s.duration ? ` · ${str(s.duration)}` : ""}</span>
            </li>
        ))}
    </ol>
);

export const Timeline = ({ node, props }: ComponentProps) => (
    <ol {...attrs(node)} style={{ listStyle: "none", margin: 0, padding: 0, borderLeft: `2px solid ${v("color-border")}` }}>
        {arr<Record<string, unknown>>(props.items).map((it, i) => (
            <li key={i} data-status={str(it.status)} style={{ padding: "0 0 16px 16px", position: "relative" }}>
                <span aria-hidden style={{ position: "absolute", left: -7, top: 4, width: 12, height: 12, borderRadius: "50%", background: statusColor(it.status) }} />
                <div style={{ fontWeight: 600 }}>{str(it.title)}</div>
                <div style={{ fontSize: v("font-size-sm"), color: v("color-text-muted") }}>{str(it.date)}</div>
                {it.description ? <div>{str(it.description)}</div> : null}
            </li>
        ))}
    </ol>
);

export const ExecutionGraph = ({ node, props }: ComponentProps) => {
    const nodes = arr<Record<string, unknown>>(props.nodes);
    const edges = arr<Record<string, unknown>>(props.edges);
    const W = 160, H = 56, GAP = 60;
    const pos = new Map(nodes.map((n, i) => [str(n.id), { x: 10 + i * (W + GAP), y: 20 }]));
    return (
        <div {...attrs(node)} style={{ ...surface, padding: v("space-md"), overflowX: "auto" }}>
            <svg role="img" aria-label="Execution graph" width={Math.max(200, 20 + nodes.length * (W + GAP))} height={H + 40}>
                {edges.map((e, i) => {
                    const a = pos.get(str(e.from ?? e.source));
                    const b = pos.get(str(e.to ?? e.target));
                    if (!a || !b) return null;
                    return <line key={i} x1={a.x + W} y1={a.y + H / 2} x2={b.x} y2={b.y + H / 2} stroke="currentColor" strokeWidth={2} markerEnd="" />;
                })}
                {nodes.map((n, i) => {
                    const p = pos.get(str(n.id))!;
                    return (
                        <g key={i} data-status={str(n.status)}>
                            <rect x={p.x} y={p.y} width={W} height={H} rx={8} fill="none" stroke={statusColor(n.status)} strokeWidth={2} />
                            <text x={p.x + W / 2} y={p.y + H / 2 + 4} textAnchor="middle" fontSize={13} fill="currentColor">{str(n.label)}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const defaultComponents = {
    page: Page, section: Section, card: Card, grid: Grid, flex: Flex, stack: Stack, dashboard: Dashboard,
    text: Text, heading: Heading, button: Button, input: Input, textarea: Textarea, select: Select, checkbox: Checkbox,
    table: Table, kpi: Kpi, chart: Chart, tabs: Tabs, dialog: Dialog, drawer: Drawer,
    workflow: Workflow, timeline: Timeline, executionGraph: ExecutionGraph,
} as const;
