import { useMemo, useState } from "react";
import { createNode, defaultASTDocument, UINode } from "@ainative-ui/ast";

const initialAST = defaultASTDocument(
    createNode("dashboard", {}, [
        createNode("kpi", { label: "Revenue", value: "$124K" })
    ])
);

const prettyJSON = (value: unknown) => JSON.stringify(value, null, 2);

function App() {
    const [ast, setAst] = useState(initialAST);
    const [renderer, setRenderer] = useState("react");
    const [raw, setRaw] = useState(prettyJSON(initialAST));

    const preview = useMemo(() => {
        try {
            const parsed = JSON.parse(raw);
            setAst(parsed as { root: UINode; version: string });
            return parsed;
        } catch {
            return null;
        }
    }, [raw]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 24 }}>
            <section>
                <h1>AI-Native UI Playground</h1>
                <label>
                    Renderer:
                    <select value={renderer} onChange={(event) => setRenderer(event.target.value)}>
                        <option value="react">React</option>
                        <option value="angular">Angular</option>
                        <option value="vue">Vue</option>
                        <option value="svelte">Svelte</option>
                    </select>
                </label>
                <textarea
                    style={{ width: "100%", minHeight: 420, marginTop: 12, fontFamily: "monospace", fontSize: 14 }}
                    value={raw}
                    onChange={(event) => setRaw(event.target.value)}
                />
            </section>
            <section>
                <h2>Live Preview</h2>
                <pre style={{ background: "#111", color: "#d7d7d7", padding: 16, borderRadius: 12, overflow: "auto" }}>
                    {preview ? prettyJSON({ renderer, document: preview }) : "Invalid JSON AST"}
                </pre>
            </section>
        </div>
    );
}

export default App;
