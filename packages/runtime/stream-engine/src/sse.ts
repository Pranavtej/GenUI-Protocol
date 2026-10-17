import { StreamFrame } from "@genui-protocol/protocol";

/** Incremental Server-Sent-Events parser: feed text chunks, get the `data:` payload of each complete event. */
export class SSEParser {
    private buffer = "";

    push(chunk: string): string[] {
        this.buffer += chunk.replace(/\r\n?/g, "\n");
        const events: string[] = [];
        let idx: number;
        while ((idx = this.buffer.indexOf("\n\n")) !== -1) {
            const raw = this.buffer.slice(0, idx);
            this.buffer = this.buffer.slice(idx + 2);
            const data = raw
                .split("\n")
                .filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).replace(/^ /, ""))
                .join("\n");
            if (data) events.push(data);
        }
        return events;
    }
}

const FRAME_TYPES = new Set(["snapshot", "patch", "data", "error", "ast"]);

/** Parses one SSE data payload into a frame. Returns null (never throws) for anything that is not a frame. */
export const parseFrame = (data: string): StreamFrame | null => {
    try {
        const value = JSON.parse(data);
        if (typeof value === "object" && value !== null && FRAME_TYPES.has(value.type)) return value as StreamFrame;
    } catch {
        /* ignore malformed payloads */
    }
    return null;
};

export type SSEConnection = { close: () => void; done: Promise<void> };

/**
 * Connects to an SSE endpoint with `fetch` (works in browsers and Node 18+) and calls `onFrame` for each frame.
 * Reconnects are the caller's job: on `done` resolve/reject, decide whether to reconnect and ask for a snapshot.
 */
export const connectSSE = (
    url: string,
    onFrame: (frame: StreamFrame) => void,
    options: { fetch?: typeof fetch; headers?: Record<string, string>; onError?: (e: unknown) => void } = {}
): SSEConnection => {
    const controller = new AbortController();
    const doFetch = options.fetch ?? fetch;
    const done = (async () => {
        try {
            const res = await doFetch(url, { headers: { Accept: "text/event-stream", ...options.headers }, signal: controller.signal });
            if (!res.ok || !res.body) throw new Error(`SSE connection failed: HTTP ${res.status}`);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            const parser = new SSEParser();
            for (;;) {
                const { value, done: finished } = await reader.read();
                if (finished) break;
                for (const data of parser.push(decoder.decode(value, { stream: true }))) {
                    const frame = parseFrame(data);
                    if (frame) onFrame(frame);
                }
            }
        } catch (e) {
            if (!controller.signal.aborted) options.onError?.(e);
        }
    })();
    return { close: () => controller.abort(), done };
};
