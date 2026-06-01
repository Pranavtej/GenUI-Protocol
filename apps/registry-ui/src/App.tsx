import { useEffect, useState } from "react";

type ComponentEntry = {
    id: string;
    name: string;
    version: string;
    description?: string;
    renderers: string[];
};

const sampleEntries: ComponentEntry[] = [
    { id: "kpi", name: "kpi", version: "1.0.0", description: "Key Performance Indicator card", renderers: ["react", "angular", "vue"] },
    { id: "chart", name: "chart", version: "1.0.0", description: "Chart visualization component", renderers: ["react", "vue", "svelte"] }
];

function App() {
    const [entries, setEntries] = useState<ComponentEntry[]>(sampleEntries);
    const [search, setSearch] = useState("");

    useEffect(() => {
        // In future, fetch from MCP service.
    }, []);

    const filtered = entries.filter((entry) => entry.name.includes(search) || entry.description?.includes(search));

    return (
        <main style={{ padding: 24, fontFamily: "Inter, sans-serif" }}>
            <h1>Component Registry</h1>
            <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search components"
                style={{ width: "100%", padding: 12, margin: "16px 0", fontSize: 16 }}
            />
            <div style={{ display: "grid", gap: 16 }}>
                {filtered.map((entry) => (
                    <article key={entry.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                        <h2>{entry.name}</h2>
                        <p>{entry.description}</p>
                        <p>
                            <strong>Version:</strong> {entry.version}
                        </p>
                        <p>
                            <strong>Renderers:</strong> {entry.renderers.join(", ")}
                        </p>
                    </article>
                ))}
            </div>
        </main>
    );
}

export default App;
