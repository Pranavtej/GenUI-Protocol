import { ASTDocument } from "@genui-protocol/ast";
import { ActionKind, ASTPatch, StreamFrame, isActionProp } from "@genui-protocol/protocol";
import { AgentEvent, createActionRunner } from "./actions.js";
import { getBindPath, resolveProps } from "./bindings.js";
import { DataStore } from "./data.js";
import { applyTreePatches, buildRuntimeTree, reconcile, RuntimeNode, RuntimeTree } from "./index.js";

export type SessionOptions = {
    document?: ASTDocument;
    onEmit?: (event: AgentEvent) => void | Promise<void>;
    onNavigate?: (to: string) => void;
    onActionError?: (errors: string[], nodeId: string) => void;
    onStreamError?: (message: string, code?: string) => void;
    allowedActions?: ActionKind[];
};

export type FrameResult = { ok: true } | { ok: false; error: string };

/**
 * The framework-neutral engine every renderer drives: it owns the runtime tree and the data model,
 * applies stream frames, resolves bindings and runs actions. Renderers only subscribe and draw.
 */
export class RuntimeSession {
    readonly data: DataStore;
    private _tree: RuntimeTree | null = null;
    private treeVersion = 0;
    private listeners = new Set<() => void>();
    private runner: ReturnType<typeof createActionRunner>;

    constructor(private options: SessionOptions = {}) {
        this.data = new DataStore(options.document?.data ?? {});
        this.runner = createActionRunner({
            data: this.data,
            onEmit: options.onEmit,
            onNavigate: options.onNavigate,
            allowedActions: options.allowedActions,
        });
        if (options.document) this._tree = buildRuntimeTree(options.document);
        this.data.subscribe(() => this.notify());
    }

    get tree(): RuntimeTree | null {
        return this._tree;
    }

    /** Changes whenever the tree or the data changes (use as an external-store snapshot). */
    get version(): number {
        return this.treeVersion + this.data.version;
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    load(document: ASTDocument): void {
        this._tree = reconcile(document, this._tree ?? undefined);
        this.treeVersion++;
        this.data.replace(document.data ?? {});
        this.notify();
    }

    applyPatches(patches: ASTPatch[], dataPatches?: ASTPatch[]): void {
        if (patches.length > 0) {
            if (!this._tree) throw new Error("No document loaded");
            this._tree = applyTreePatches(this._tree, patches);
            this.treeVersion++;
        }
        if (dataPatches && dataPatches.length > 0) this.data.applyPatches(dataPatches);
        this.notify();
    }

    /** Applies one stream frame. Never throws: failures are returned so callers can request a resync. */
    applyFrame(frame: StreamFrame): FrameResult {
        try {
            switch (frame.type) {
                case "snapshot":
                    this.load(frame.document as ASTDocument);
                    break;
                case "ast":
                    this.load(frame.ast as ASTDocument);
                    break;
                case "patch":
                    this.applyPatches(frame.patches, frame.dataPatches);
                    break;
                case "data":
                    this.data.applyPatches(frame.patches);
                    break;
                case "error":
                    this.options.onStreamError?.(frame.message, frame.code);
                    break;
                default:
                    return { ok: false, error: `Unknown frame type "${(frame as { type: string }).type}"` };
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
    }

    /** Props of `node` with `$bind` / `$tpl` resolved against the current data. */
    resolveProps(node: RuntimeNode): Record<string, unknown> {
        return resolveProps(node.p, this.data.snapshot());
    }

    /** Runs the actions held in `node.p[eventProp]` (e.g. `onClick`). */
    async dispatch(node: RuntimeNode, eventProp: string, event?: Record<string, unknown>) {
        if (!isActionProp(eventProp)) return { executed: 0, errors: [`"${eventProp}" is not an action prop`] };
        const result = await this.runner.run(node.p?.[eventProp], { nodeId: node.id, event });
        if (result.errors.length > 0) this.options.onActionError?.(result.errors, node.id);
        return result;
    }

    /** The data path a prop is two-way bound to (`value: { "$bind": "form.name" }`), if any. */
    getBinding(node: RuntimeNode, prop: string): string | null {
        return getBindPath(node.p?.[prop]);
    }

    /** Writes `value` to the data path bound to `prop`. Returns false when the prop is not bound. */
    setBound(node: RuntimeNode, prop: string, value: unknown): boolean {
        const path = this.getBinding(node, prop);
        if (!path) return false;
        this.data.set(path, value);
        return true;
    }

    private notify() {
        this.listeners.forEach((l) => l());
    }
}

export const createSession = (options?: SessionOptions) => new RuntimeSession(options);
