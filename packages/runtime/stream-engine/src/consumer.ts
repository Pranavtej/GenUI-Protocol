import { StreamFrame } from "@genui-protocol/protocol";

export type ApplyResult = { ok: true } | { ok: false; error: string };

export type ResyncReason = "gap" | "apply-failed" | "joined-mid-stream" | "timeout";

export type StreamConsumerOptions = {
    /** Applies one in-order frame (typically `session.applyFrame`). */
    apply: (frame: StreamFrame) => ApplyResult;
    /** Called when the consumer can no longer trust its state; the host should request a fresh snapshot. */
    onResync?: (reason: ResyncReason, detail?: string) => void;
    /** Out-of-order frames held while waiting for a gap to fill (default 64). */
    maxBuffer?: number;
    /** How long to wait for a missing frame before asking for a resync (default 2000ms, 0 disables). */
    gapTimeoutMs?: number;
};

/**
 * Applies stream frames strictly in `sequence` order.
 * - frames without a sequence are applied immediately (legacy producers);
 * - duplicates are dropped; out-of-order frames are buffered until the gap fills;
 * - a gap that is not filled in time, a failed apply, or joining mid-stream triggers `onResync`;
 * - after a resync request, deltas are ignored until a snapshot arrives.
 */
export class StreamConsumer {
    private expected: number | null = null;
    private buffer = new Map<number, StreamFrame>();
    private desynced = false;
    private gapTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly maxBuffer: number;
    private readonly gapTimeoutMs: number;

    constructor(private options: StreamConsumerOptions) {
        this.maxBuffer = options.maxBuffer ?? 64;
        this.gapTimeoutMs = options.gapTimeoutMs ?? 2000;
    }

    get needsSnapshot(): boolean {
        return this.desynced;
    }

    push(frame: StreamFrame): void {
        const isSnapshot = frame.type === "snapshot" || frame.type === "ast";

        if (frame.sequence === undefined) {
            if (isSnapshot) this.desynced = false;
            if (this.desynced && !isSnapshot) return;
            this.applyOrResync(frame);
            return;
        }

        if (isSnapshot) {
            // A snapshot (re)establishes the baseline at its sequence.
            this.clearGapTimer();
            this.buffer.forEach((_f, seq) => seq <= frame.sequence! && this.buffer.delete(seq));
            this.desynced = false;
            if (!this.applyOrResync(frame)) return;
            this.expected = frame.sequence + 1;
            this.drain();
            return;
        }

        if (this.desynced) return;

        if (this.expected === null) {
            if (frame.sequence === 1) this.expected = 1;
            else return this.requestResync("joined-mid-stream", `first frame has sequence ${frame.sequence}`);
        }

        if (frame.sequence < this.expected!) return; // duplicate / already applied

        this.buffer.set(frame.sequence, frame);
        if (this.buffer.size > this.maxBuffer) return this.requestResync("gap", `buffer exceeded ${this.maxBuffer} frames`);
        this.drain();
    }

    dispose(): void {
        this.clearGapTimer();
        this.buffer.clear();
    }

    private drain() {
        while (this.expected !== null && this.buffer.has(this.expected)) {
            const frame = this.buffer.get(this.expected)!;
            this.buffer.delete(this.expected);
            this.expected++;
            if (!this.applyOrResync(frame)) return;
        }
        this.clearGapTimer();
        if (this.buffer.size > 0 && this.gapTimeoutMs > 0) {
            this.gapTimer = setTimeout(() => this.requestResync("timeout", `missing sequence ${this.expected}`), this.gapTimeoutMs);
        }
    }

    private applyOrResync(frame: StreamFrame): boolean {
        const result = this.options.apply(frame);
        if (result.ok) return true;
        this.requestResync("apply-failed", result.error);
        return false;
    }

    private requestResync(reason: ResyncReason, detail?: string) {
        this.clearGapTimer();
        this.buffer.clear();
        this.desynced = true;
        this.expected = null;
        this.options.onResync?.(reason, detail);
    }

    private clearGapTimer() {
        if (this.gapTimer) clearTimeout(this.gapTimer);
        this.gapTimer = null;
    }
}
