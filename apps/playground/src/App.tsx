import { useEffect, useMemo, useRef, useState } from "react";
import { GenUiRenderer } from "@genui-protocol/renderer-react";
import { createSession, type AgentEvent } from "@genui-protocol/runtime-core";
import { validateDocument } from "@genui-protocol/validation";
import type { ASTDocument } from "@genui-protocol/ast";
import { EXAMPLES } from "./examples";

const pretty = (v: unknown) => JSON.stringify(v, null, 2);
const firstExample = Object.keys(EXAMPLES)[0];

function App() {
    const [example, setExample] = useState(firstExample);
    const [raw, setRaw] = useState(pretty(EXAMPLES[firstExample]));
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [patchText, setPatchText] = useState('[{ "op": "replace", "path": "/p/title", "value": "Patched title" }]');
    const [patchError, setPatchError] = useState<string | null>(null);

    // One long-lived session; the editor reloads documents into it.
    const session = useMemo(() => createSession({ onEmit: (e) => setEvents((prev) => [e, ...prev].slice(0, 20)) }), []);
    const [parsed, setParsed] = useState<{ doc?: ASTDocument; errors: string[] }>({ errors: [] });
    const [dataJson, setDataJson] = useState("{}");
    const loaded = useRef(false);

    useEffect(() => {
        let doc: ASTDocument;
        try {
            doc = JSON.parse(raw);
        } catch (e) {
            setParsed({ errors: [`Invalid JSON: ${(e as Error).message}`] });
            return;
        }
        const result = validateDocument(doc);
        if (!result.valid) {
            setParsed({ errors: result.errors ?? ["Invalid document"] });
            return;
        }
        setParsed({ doc, errors: [] });
        session.load(doc);
        loaded.current = true;
    }, [raw, session]);

    useEffect(() => {
        const sync = () => setDataJson(pretty(session.data.snapshot()));
        sync();
        return session.subscribe(sync);
    }, [session]);

    const applyPatch = () => {
        try {
            const result = session.applyFrame({ type: "patch", patches: JSON.parse(patchText) });
            setPatchError(result.ok ? null : result.error);
        } catch (e) {
            setPatchError((e as Error).message);
        }
    };

    const box = { width: "100%", fontFamily: "monospace", fontSize: 13, boxSizing: "border-box" as const };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1.4fr)", gap: 16, padding: 16, fontFamily: "system-ui, sans-serif" }}>
            <section>
                <h1 style={{ marginTop: 0 }}>GenUI Protocol Playground</h1>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <select value={example} onChange={(e) => { setExample(e.target.value); setRaw(pretty(EXAMPLES[e.target.value])); setEvents([]); }}>
                        {Object.keys(EXAMPLES).map((name) => <option key={name}>{name}</option>)}
                    </select>
                    <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <textarea style={{ ...box, minHeight: 360 }} value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} aria-label="Document JSON" />
                {parsed.errors.length > 0 ? (
                    <ul role="alert" style={{ color: "#b91c1c", fontSize: 13, paddingLeft: 18 }}>{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                ) : (
                    <p style={{ color: "#15803d", fontSize: 13 }}>✓ Valid document</p>
                )}
                <h3>Send a stream patch</h3>
                <textarea style={{ ...box, minHeight: 70 }} value={patchText} onChange={(e) => setPatchText(e.target.value)} spellCheck={false} aria-label="Patch JSON" />
                <button type="button" onClick={applyPatch}>Apply patch</button>
                {patchError ? <span role="alert" style={{ color: "#b91c1c", marginLeft: 8 }}>{patchError}</span> : null}
            </section>
            <section>
                <h2 style={{ marginTop: 0 }}>Live preview</h2>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: theme === "dark" ? "#0b1220" : "#fff", minHeight: 200 }}>
                    <GenUiRenderer session={session} theme={theme} />
                </div>
                <h3>Data model</h3>
                <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 200 }}>{dataJson}</pre>
                <h3>Events sent to the agent</h3>
                <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 200 }}>{events.length ? pretty(events) : "(interact with the preview — emit/submit actions show up here)"}</pre>
            </section>
        </div>
    );
}

export default App;
