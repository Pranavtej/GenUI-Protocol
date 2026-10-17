import { InjectionToken, Signal, signal } from "@angular/core";
import type { RuntimeNode, RuntimeSession } from "@genui-protocol/runtime-core";

/** Provide a `RuntimeSession` to enable data binding (`$bind`/`$tpl`), actions and two-way inputs. */
export const GENUI_SESSION = new InjectionToken<RuntimeSession | null>("GENUI_SESSION");

export const provideGenUiSession = (session: RuntimeSession) => ({ provide: GENUI_SESSION, useValue: session });

/** A signal that changes whenever the session's tree or data changes. */
export const sessionVersion = (session: RuntimeSession): Signal<number> => {
    const version = signal(session.version);
    session.subscribe(() => version.set(session.version));
    return version;
};

const RAW = Symbol.for("genui.rawNode");

/** Returns a copy of `raw` with resolved props, remembering the original (unresolved) node. */
export const withResolvedProps = (raw: RuntimeNode, props: Record<string, unknown>): RuntimeNode => {
    const resolved = { ...raw, p: props } as RuntimeNode;
    Object.defineProperty(resolved, RAW, { value: raw, enumerable: false });
    return resolved;
};

export const rawNode = (node: RuntimeNode): RuntimeNode => ((node as unknown as Record<symbol, RuntimeNode>)[RAW] ?? node);

/** Runs the actions in `node.p[prop]` (e.g. "onClick"). No-op without a session. */
export const runActions = (session: RuntimeSession | null, node: RuntimeNode, prop: string, event?: Record<string, unknown>): void => {
    if (session) void session.dispatch(rawNode(node), prop, event);
};

/**
 * Stores a user-edited value. If `prop` is `$bind`-ed it is written to the session's data model; otherwise it is
 * kept on the node itself (uncontrolled), as before sessions existed.
 */
export const writeField = (session: RuntimeSession | null, node: RuntimeNode, prop: string, value: unknown): void => {
    const raw = rawNode(node);
    if (session && session.setBound(raw, prop, value)) return;
    if (!raw.p) raw.p = {};
    raw.p[prop] = value;
    if (node !== raw) {
        if (!node.p) node.p = {};
        node.p[prop] = value;
    }
};
