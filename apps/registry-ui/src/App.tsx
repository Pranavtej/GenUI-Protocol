import { useEffect, useMemo, useState } from "react";
import { ComponentRegistry, type RegistryEntry } from "@genui-protocol/component-registry";
import { GenUiRenderer, createSession } from "@genui-protocol/renderer-react";
import type { UINode } from "@genui-protocol/ast";
import { categories, filterEntries, propRows } from "./lib";

const bundled = new ComponentRegistry().list();
const server = new URLSearchParams(window.location.search).get("server");

const Example = ({ node }: { node: UINode }) => {
    const session = useMemo(() => createSession({ document: { version: "1.0.0", root: node } }), [node]);
    return (
        <div>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                <GenUiRenderer session={session} />
            </div>
            <details>
                <summary>JSON</summary>
                <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, overflow: "auto" }}>{JSON.stringify(node, null, 2)}</pre>
            </details>
        </div>
    );
};

const Detail = ({ entry }: { entry: RegistryEntry }) => (
    <article>
        <h2 style={{ marginTop: 0 }}>
            <code>{entry.id}</code> <small style={{ color: "#64748b", fontWeight: 400 }}>{entry.category} · v{entry.version}</small>
        </h2>
        <p>{entry.description}</p>
        <p>
            <strong>Renderers:</strong> {(entry.renderers ?? []).map((r) => <span key={r} style={{ background: "#e2e8f0", borderRadius: 999, padding: "2px 8px", marginRight: 6, fontSize: 12 }}>{r}</span>)}
        </p>
        {entry.events?.length ? <p><strong>Events:</strong> {entry.events.map((e) => `on${e[0].toUpperCase()}${e.slice(1)}`).join(", ")}</p> : null}
        <h3>Props</h3>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
            <thead><tr>{["Name", "Type", "Required"].map((h) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #cbd5e1", padding: 6 }}>{h}</th>)}</tr></thead>
            <tbody>
                {propRows(entry.schema).map((r) => (
                    <tr key={r.name}>
                        <td style={{ padding: 6 }}><code>{r.name}</code></td>
                        <td style={{ padding: 6 }}><code>{r.type}</code></td>
                        <td style={{ padding: 6 }}>{r.required ? "yes" : ""}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <p style={{ color: "#64748b", fontSize: 13 }}>Any prop can be a <code>{"{ \"$bind\": \"path\" }"}</code> or <code>{"{ \"$tpl\": \"…{{path}}…\" }"}</code> expression.</p>
        <h3>Examples</h3>
        {(entry.examples ?? []).length === 0 ? <p>No examples.</p> : (entry.examples ?? []).map((ex, i) => <Example key={`${entry.id}-${i}`} node={ex} />)}
        <details>
            <summary>Props JSON Schema</summary>
            <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, overflow: "auto" }}>{JSON.stringify(entry.schema, null, 2)}</pre>
        </details>
    </article>
);

function App() {
    const [entries, setEntries] = useState<RegistryEntry[]>(bundled);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [selected, setSelected] = useState<string>(bundled[0]?.id ?? "");
    const [error, setError] = useState<string | null>(null);

    // `?server=http://localhost:4000` shows the registry of a running MCP server instead of the bundled one.
    useEffect(() => {
        if (!server) return;
        fetch(`${server.replace(/\/+$/, "")}/api/discover_components`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((list: RegistryEntry[]) => { setEntries(list); setError(null); })
            .catch((e: Error) => setError(`Could not load ${server}: ${e.message}. Showing the bundled registry.`));
    }, []);

    const visible = useMemo(() => filterEntries(entries, query, category), [entries, query, category]);
    const current = entries.find((e) => e.id === selected) ?? visible[0];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
            <aside style={{ borderRight: "1px solid #e2e8f0", padding: 16 }}>
                <h1 style={{ fontSize: 20, marginTop: 0 }}>Component Registry</h1>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search components" aria-label="Search components" style={{ width: "100%", padding: 8, boxSizing: "border-box" }} />
                <div style={{ margin: "8px 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[null, ...categories(entries)].map((c) => (
                        <button key={c ?? "all"} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} style={{ borderRadius: 999, border: "1px solid #cbd5e1", padding: "2px 10px", background: category === c ? "#2563eb" : "#fff", color: category === c ? "#fff" : "inherit", cursor: "pointer" }}>
                            {c ?? "all"}
                        </button>
                    ))}
                </div>
                {error ? <p role="alert" style={{ color: "#b45309", fontSize: 13 }}>{error}</p> : null}
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {visible.map((e) => (
                        <li key={e.id}>
                            <button type="button" onClick={() => setSelected(e.id)} style={{ width: "100%", textAlign: "left", padding: "6px 8px", border: "none", borderRadius: 6, cursor: "pointer", background: current?.id === e.id ? "#e0e7ff" : "transparent" }}>
                                <code>{e.id}</code> <small style={{ color: "#64748b" }}>{e.category}</small>
                            </button>
                        </li>
                    ))}
                    {visible.length === 0 ? <li style={{ color: "#64748b" }}>No matches.</li> : null}
                </ul>
            </aside>
            <main style={{ padding: 24, overflow: "auto" }}>{current ? <Detail entry={current} /> : <p>Select a component.</p>}</main>
        </div>
    );
}

export default App;
