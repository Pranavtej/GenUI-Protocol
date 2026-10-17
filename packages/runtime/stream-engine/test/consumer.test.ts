import { afterEach, describe, expect, it, vi } from "vitest";
import type { StreamFrame } from "@genui-protocol/protocol";
import { SSEParser, StreamConsumer, connectSSE, parseFrame } from "../src/index";

const patch = (sequence?: number): StreamFrame => ({ type: "patch", sequence, patches: [{ op: "add", path: "/p/n", value: sequence ?? 0 }] });
const snapshot = (sequence?: number): StreamFrame => ({ type: "snapshot", sequence, document: { version: "1.0.0", root: { t: "page" } } });

const setup = (opts: { fail?: (f: StreamFrame) => boolean; gapTimeoutMs?: number; maxBuffer?: number } = {}) => {
    const applied: Array<number | undefined> = [];
    const onResync = vi.fn();
    const consumer = new StreamConsumer({
        apply: (f) => {
            if (opts.fail?.(f)) return { ok: false, error: "boom" };
            applied.push(f.sequence);
            return { ok: true };
        },
        onResync,
        gapTimeoutMs: opts.gapTimeoutMs ?? 0,
        maxBuffer: opts.maxBuffer,
    });
    return { consumer, applied, onResync };
};

afterEach(() => vi.useRealTimers());

describe("StreamConsumer", () => {
    it("applies in order, reorders early frames and drops duplicates", () => {
        const { consumer, applied, onResync } = setup();
        [patch(1), patch(3), patch(2), patch(2), patch(4)].forEach((f) => consumer.push(f));
        expect(applied).toEqual([1, 2, 3, 4]);
        expect(onResync).not.toHaveBeenCalled();
    });

    it("applies unsequenced (legacy) frames immediately", () => {
        const { consumer, applied } = setup();
        consumer.push(patch());
        consumer.push({ type: "ast", ast: { version: "1.0.0", root: { t: "page" } } });
        expect(applied).toEqual([undefined, undefined]);
    });

    it("asks for a resync when joining mid-stream, then recovers on a snapshot", () => {
        const { consumer, applied, onResync } = setup();
        consumer.push(patch(7));
        expect(onResync).toHaveBeenCalledWith("joined-mid-stream", expect.any(String));
        consumer.push(patch(8));
        expect(applied).toEqual([]); // deltas ignored while desynced
        consumer.push(snapshot(9));
        consumer.push(patch(10));
        expect(applied).toEqual([9, 10]);
        expect(consumer.needsSnapshot).toBe(false);
    });

    it("requests a resync when a gap is not filled in time", () => {
        vi.useFakeTimers();
        const { consumer, applied, onResync } = setup({ gapTimeoutMs: 1000 });
        consumer.push(patch(1));
        consumer.push(patch(3));
        vi.advanceTimersByTime(999);
        expect(onResync).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2);
        expect(onResync).toHaveBeenCalledWith("timeout", "missing sequence 2");
        expect(applied).toEqual([1]);
    });

    it("requests a resync when the buffer overflows or an apply fails", () => {
        const a = setup({ maxBuffer: 2 });
        a.consumer.push(patch(1));
        [3, 4, 5].forEach((n) => a.consumer.push(patch(n)));
        expect(a.onResync).toHaveBeenCalledWith("gap", expect.any(String));

        const b = setup({ fail: (f) => f.sequence === 2 });
        [1, 2, 3].forEach((n) => b.consumer.push(patch(n)));
        expect(b.onResync).toHaveBeenCalledWith("apply-failed", "boom");
        expect(b.applied).toEqual([1]);
    });

    it("a snapshot discards stale buffered frames", () => {
        const { consumer, applied } = setup();
        consumer.push(patch(1));
        consumer.push(patch(5));
        consumer.push(snapshot(6));
        consumer.push(patch(7));
        expect(applied).toEqual([1, 6, 7]);
    });
});

describe("SSE", () => {
    it("parses events split across chunks, CRLF and multi-line data", () => {
        const p = new SSEParser();
        expect(p.push('data: {"a"')).toEqual([]);
        expect(p.push(':1}\r\n\r\ndata: x\ndata: y\n\n: comment\n\n')).toEqual(['{"a":1}', "x\ny"]);
    });

    it("parseFrame ignores junk", () => {
        expect(parseFrame("not json")).toBeNull();
        expect(parseFrame('{"type":"nope"}')).toBeNull();
        expect(parseFrame('{"type":"patch","patches":[]}')).toEqual({ type: "patch", patches: [] });
    });

    it("connectSSE streams frames from fetch", async () => {
        const body = new ReadableStream({
            start(c) {
                const enc = new TextEncoder();
                c.enqueue(enc.encode('data: {"type":"patch","sequence":1,"patches":[]}\n\ndata: {"type":"da'));
                c.enqueue(enc.encode('ta","sequence":2,"patches":[]}\n\n'));
                c.close();
            },
        });
        const frames: StreamFrame[] = [];
        const conn = connectSSE("http://x/stream", (f) => frames.push(f), { fetch: (async () => new Response(body, { status: 200 })) as typeof fetch });
        await conn.done;
        expect(frames.map((f) => f.sequence)).toEqual([1, 2]);
    });
});
