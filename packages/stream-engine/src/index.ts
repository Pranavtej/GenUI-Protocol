import { ASTPatch } from "@ainative-ui/protocol";

export type TransportProtocol = "websocket" | "sse" | "http" | string;

export type StreamEvent = {
    transport: TransportProtocol;
    patches: ASTPatch[];
    timestamp: string;
    sequence: number;
};

export interface StreamTransport {
    send(event: StreamEvent): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    onMessage(callback: (event: StreamEvent) => void): void;
}

export class PatchStreamer {
    private transport: StreamTransport;
    private patchQueue: ASTPatch[] = [];
    private sequence = 0;
    private batchTimer: any = null;
    private batchIntervalMs: number;

    constructor(transport: StreamTransport, batchIntervalMs = 50) {
        this.transport = transport;
        this.batchIntervalMs = batchIntervalMs;
    }

    public queuePatch(patch: ASTPatch) {
        this.patchQueue.push(patch);
        this.startBatchTimer();
    }

    public queuePatches(patches: ASTPatch[]) {
        this.patchQueue.push(...patches);
        this.startBatchTimer();
    }

    private startBatchTimer() {
        if (this.batchTimer) return;
        this.batchTimer = setTimeout(() => {
            this.flush();
        }, this.batchIntervalMs);
    }

    public flush() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        if (this.patchQueue.length === 0) return;

        const event: StreamEvent = {
            transport: "custom",
            patches: [...this.patchQueue],
            timestamp: new Date().toISOString(),
            sequence: ++this.sequence,
        };

        this.patchQueue = [];
        this.transport.send(event).catch((err) => {
            console.error("Failed to send patch stream event:", err);
        });
    }
}

export const createPatch = (op: ASTPatch["op"], path: string, value?: unknown, from?: string): ASTPatch => ({
    op,
    path,
    ...(value !== undefined ? { value } : {}),
    ...(from ? { from } : {})
});

// Simple Mock transport for testing and local SSE connection
export class LocalStreamTransport implements StreamTransport {
    private listeners = new Set<(event: StreamEvent) => void>();
    private isConnected = false;

    async connect(): Promise<void> {
        this.isConnected = true;
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
        this.listeners.clear();
    }

    async send(event: StreamEvent): Promise<void> {
        if (!this.isConnected) {
            throw new Error("Local transport is not connected");
        }
        this.listeners.forEach((listener) => listener(event));
    }

    onMessage(callback: (event: StreamEvent) => void): void {
        this.listeners.add(callback);
    }
}

