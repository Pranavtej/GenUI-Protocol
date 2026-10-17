import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenUiRenderer } from "@genui-protocol/renderer-react";
import { createSession, type AgentEvent, type RuntimeSession } from "@genui-protocol/runtime-core";
import { StreamConsumer } from "@genui-protocol/stream-engine";
import type { StreamFrame } from "@genui-protocol/protocol";
import { EXAMPLE_LIST, type Example } from "@genui-protocol/examples";

const pretty = (v: unknown) => JSON.stringify(v, null, 2);

type LogLine = { at: string; kind: "frame" | "event" | "reply"; text: string };

function Demo({ example, theme }: { example: Example; theme: "light" | "dark" }) {
    const [log, setLog] = useState<LogLine[]>([]);
    const [playing, setPlaying] = useState(false);
    const timers = useRef<number[]>([]);
    const push = useCallback((kind: LogLine["kind"], text: string) => setLog((l) => [{ at: new Date().toLocaleTimeString(), kind, text }, ...l].slice(0, 30)), []);

    // The "agent" here is scripted: it answers UI events with frames, exactly as a real agent would over SSE.
    const sessionRef = useRef<RuntimeSession | null>(null);
    const session = useMemo(() => {
        const s = createSession({
            document: example.document,
            onEmit: (event: AgentEvent) => {
                push("event", `${event.name} ${JSON.stringify(event.payload)}`);
                window.setTimeout(() => {
                    for (const frame of example.reply?.(event) ?? []) {
                        const result = sessionRef.current?.applyFrame(frame);
                        push("reply", `${frame.type} ${result?.ok ? "applied" : "FAILED"}`);
                    }
                }, 400);
            },
        });
        sessionRef.current = s;
        return s;
    }, [example, push]);

    const consumer = useMemo(
        () => new StreamConsumer({ apply: (f) => session.applyFrame(f), onResync: (reason) => push("frame", `resync requested (${reason})`) }),
        [session, push]
    );

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const play = () => {
        if (playing || !example.live?.length) return;
        setPlaying(true);
        // Frame 1 is the initial document: the consumer needs it as its baseline.
        consumer.push({ type: "snapshot", sequence: 1, document: example.document });
        example.live.forEach((frame: StreamFrame, i) => {
            timers.current.push(window.setTimeout(() => {
                consumer.push(frame);
                push("frame", `#${frame.sequence} ${frame.type}`);
                if (i === example.live!.length - 1) setPlaying(false);
            }, 1200 * (i + 1)));
        });
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(260px,1fr)", gap: 16 }}>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: theme === "dark" ? "#0b1220" : "#fff" }}>
                <GenUiRenderer session={session} theme={theme} />
            </div>
            <aside>
                {example.live?.length ? <button type="button" onClick={play} disabled={playing}>{playing ? "Streaming…" : "▶ Play stream"}</button> : <p style={{ color: "#64748b", marginTop: 0 }}>Interact with the form: submit sends an event to the scripted agent.</p>}
                <h3>Wire log</h3>
                <ul style={{ listStyle: "none", padding: 0, fontFamily: "monospace", fontSize: 12 }}>
                    {log.length === 0 ? <li style={{ color: "#64748b" }}>(nothing yet)</li> : log.map((l, i) => <li key={i}>{l.at} <b>{l.kind}</b> {l.text}</li>)}
                </ul>
                <details>
                    <summary>Document JSON</summary>
                    <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 360 }}>{pretty(example.document)}</pre>
                </details>
            </aside>
        </div>
    );
}

export default function App() {
    const [id, setId] = useState(EXAMPLE_LIST[0].id);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const example = EXAMPLE_LIST.find((e) => e.id === id)!;
    return (
        <div style={{ fontFamily: "system-ui, sans-serif", padding: 16, maxWidth: 1400, margin: "0 auto" }}>
            <header style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                <h1 style={{ margin: 0 }}>GenUI Protocol examples</h1>
                <nav aria-label="Examples" style={{ display: "flex", gap: 8 }}>
                    {EXAMPLE_LIST.map((e) => (
                        <button key={e.id} type="button" aria-pressed={e.id === id} onClick={() => setId(e.id)} style={{ fontWeight: e.id === id ? 700 : 400 }}>{e.title}</button>
                    ))}
                </nav>
                <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Dark" : "Light"}</button>
            </header>
            <p style={{ color: "#475569" }}>{example.description}</p>
            <Demo key={example.id} example={example} theme={theme} />
        </div>
    );
}
