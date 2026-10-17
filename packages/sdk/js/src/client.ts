import type { ASTDocument } from "@genui-protocol/ast";
import type { ASTPatch, StreamFrame } from "@genui-protocol/protocol";
import { connectSSE, type SSEConnection } from "@genui-protocol/stream-engine";
import type { ValidationResult } from "@genui-protocol/validation";

export type McpClientOptions = {
    /** e.g. `http://localhost:4000` */
    baseUrl: string;
    apiKey?: string;
    fetch?: typeof fetch;
    /** Per-request timeout (default 15s). */
    timeoutMs?: number;
};

export class McpHttpError extends Error {
    constructor(public readonly status: number, public readonly body: unknown, message: string) {
        super(message);
        this.name = "McpHttpError";
    }
}

/** Typed client for the GenUI MCP server's REST sidecar. */
export class McpClient {
    private readonly base: string;
    private readonly doFetch: typeof fetch;

    constructor(private options: McpClientOptions) {
        this.base = options.baseUrl.replace(/\/+$/, "");
        this.doFetch = options.fetch ?? fetch;
    }

    private headers(): Record<string, string> {
        return this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {};
    }

    private async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
        const res = await this.doFetch(this.base + path, {
            method,
            headers: { ...this.headers(), ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(this.options.timeoutMs ?? 15_000),
        });
        const parsed: unknown = await res.json().catch(() => undefined);
        if (!res.ok) {
            const message = (parsed as { message?: string; error?: string } | undefined)?.message ?? (parsed as { error?: string } | undefined)?.error ?? res.statusText;
            throw new McpHttpError(res.status, parsed, `GenUI MCP ${method} ${path} failed (${res.status}): ${message}`);
        }
        return parsed as T;
    }

    discoverComponents() { return this.request<Array<Record<string, unknown>>>("GET", "/api/discover_components"); }
    getComponent(name: string) { return this.request<Record<string, unknown>>("GET", `/api/get_component?name=${encodeURIComponent(name)}`); }
    searchComponents(q: string) { return this.request<Array<Record<string, unknown>>>("GET", `/api/search_components?q=${encodeURIComponent(q)}`); }
    /** System prompt + tool definitions to give your LLM. */
    guide() { return this.request<{ systemPrompt: string; tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> }>("GET", "/api/protocol_guide"); }
    validate(document: unknown, renderer?: string) { return this.request<ValidationResult>("POST", "/api/validate_document", { document, renderer }); }
    template(type: string) { return this.request<ASTDocument>("GET", `/api/generate_template?type=${encodeURIComponent(type)}`); }

    /** Publishes a new baseline to every subscriber. Resolves with the frame's sequence number. */
    streamDocument(document: ASTDocument) { return this.request<{ sequence: number; clientsNotified: number }>("POST", "/api/stream_ast", { ast: document }); }
    streamPatch(patches: ASTPatch[], dataPatches?: ASTPatch[]) { return this.request<{ sequence: number; clientsNotified: number }>("POST", "/api/stream_patch", { patches, dataPatches }); }
    streamData(patches: ASTPatch[]) { return this.request<{ sequence: number; clientsNotified: number }>("POST", "/api/stream_data", { patches }); }

    /** Subscribes to the frame stream (snapshot replay included). Feed frames to a `StreamConsumer`. */
    subscribe(onFrame: (frame: StreamFrame) => void, onError?: (e: unknown) => void): SSEConnection {
        return connectSSE(this.base + "/api/stream", onFrame, { fetch: this.doFetch, headers: this.headers(), onError });
    }
}
