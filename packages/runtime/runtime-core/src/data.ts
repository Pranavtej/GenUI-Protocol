import { ASTPatch } from "@genui-protocol/protocol";
import { applyJsonPatch, cloneJson } from "./patch.js";
import { parsePointer } from "./pointer.js";

const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

/** Parses a data path: JSON Pointer (`/a/b/0`) or dotted (`a.b.0`). */
export const parseDataPath = (path: string): string[] => {
    if (path.startsWith("/")) return parsePointer(path);
    return path === "" ? [] : path.split(".");
};

export const getAtPath = (data: unknown, tokens: string[]): unknown => {
    let current: unknown = data;
    for (const token of tokens) {
        if (FORBIDDEN.has(token) || typeof current !== "object" || current === null) return undefined;
        current = (current as Record<string, unknown>)[token];
    }
    return current;
};

const setAtPath = (data: unknown, tokens: string[], value: unknown): unknown => {
    if (tokens.length === 0) return value;
    const [head, ...rest] = tokens;
    if (FORBIDDEN.has(head)) throw new Error(`Forbidden data path token "${head}"`);
    const base: unknown = typeof data === "object" && data !== null ? data : /^\d+$/.test(head) ? [] : {};
    const child = (base as Record<string, unknown>)[head];
    const next = setAtPath(child, rest, value);
    if (Array.isArray(base)) {
        const copy = [...base];
        copy[Number(head)] = next;
        return copy;
    }
    return { ...(base as Record<string, unknown>), [head]: next };
};

/** Small immutable data model with change notification. Framework renderers subscribe to it. */
export class DataStore {
    private state: Record<string, unknown>;
    private listeners = new Set<() => void>();
    private _version = 0;

    constructor(initial: Record<string, unknown> = {}) {
        this.state = cloneJson(initial);
    }

    /** Increments on every change; handy as a cheap snapshot for external-store hooks. */
    get version(): number {
        return this._version;
    }

    snapshot(): Record<string, unknown> {
        return this.state;
    }

    get(path: string): unknown {
        return getAtPath(this.state, parseDataPath(path));
    }

    set(path: string, value: unknown): void {
        const next = setAtPath(this.state, parseDataPath(path), cloneJson(value));
        this.commit(next as Record<string, unknown>);
    }

    replace(data: Record<string, unknown>): void {
        this.commit(cloneJson(data));
    }

    applyPatches(patches: ASTPatch[]): void {
        this.commit(applyJsonPatch(this.state, patches));
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private commit(next: Record<string, unknown>) {
        this.state = next;
        this._version++;
        this.listeners.forEach((l) => l());
    }
}
