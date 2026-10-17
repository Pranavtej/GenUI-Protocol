import { Action, ActionKind, ACTION_KINDS, MAX_ACTIONS_PER_EVENT, toActionList, validateAction } from "@genui-protocol/protocol";
import { DataStore } from "./data.js";
import { lookupIn, resolveValue } from "./bindings.js";
import { cloneJson } from "./patch.js";

/** An event the UI sends to the host/agent (`emit` and `submit` actions). */
export type AgentEvent = {
    name: string;
    payload: Record<string, unknown>;
    nodeId?: string;
    timestamp: string;
};

export type ActionRunnerOptions = {
    data: DataStore;
    onEmit?: (event: AgentEvent) => void | Promise<void>;
    onNavigate?: (to: string) => void;
    /** Restrict which action kinds may run (default: all). */
    allowedActions?: ActionKind[];
};

export type ActionContext = {
    nodeId?: string;
    /** Exposed to action values as `$event`, e.g. `{ "$bind": "$event.value" }`. */
    event?: Record<string, unknown>;
};

export type ActionResult = { executed: number; errors: string[] };

export const createActionRunner = (options: ActionRunnerOptions) => {
    const allowed = new Set<ActionKind>(options.allowedActions ?? ACTION_KINDS);

    const runOne = async (action: Action, ctx: ActionContext) => {
        const lookup = lookupIn(options.data.snapshot(), { $event: ctx.event ?? {} });
        switch (action.do) {
            case "setData":
                options.data.set(action.path, resolveValue(action.value, lookup));
                break;
            case "toggle":
                options.data.set(action.path, !options.data.get(action.path));
                break;
            case "navigate":
                options.onNavigate?.(action.to);
                break;
            case "emit":
                await options.onEmit?.({
                    name: action.name,
                    payload: resolveValue(action.payload ?? {}, lookup) as Record<string, unknown>,
                    nodeId: ctx.nodeId,
                    timestamp: new Date().toISOString(),
                });
                break;
            case "submit": {
                const form = options.data.get(action.from);
                await options.onEmit?.({
                    name: action.name,
                    payload: { data: cloneJson(form ?? null) } as Record<string, unknown>,
                    nodeId: ctx.nodeId,
                    timestamp: new Date().toISOString(),
                });
                break;
            }
        }
    };

    /** Runs an action prop (single action or list) in order. Invalid or disallowed actions are skipped and reported, never thrown. */
    const run = async (actionProp: unknown, ctx: ActionContext = {}): Promise<ActionResult> => {
        const list = toActionList(actionProp);
        const result: ActionResult = { executed: 0, errors: [] };
        if (list.length > MAX_ACTIONS_PER_EVENT) {
            result.errors.push(`Too many actions (${list.length} > ${MAX_ACTIONS_PER_EVENT})`);
            return result;
        }
        for (const action of list) {
            const problems = validateAction(action);
            if (problems.length > 0) {
                result.errors.push(...problems);
                continue;
            }
            const typed = action as Action;
            if (!allowed.has(typed.do)) {
                result.errors.push(`Action "${typed.do}" is not allowed`);
                continue;
            }
            try {
                await runOne(typed, ctx);
                result.executed++;
            } catch (e) {
                result.errors.push(`Action "${typed.do}" failed: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        return result;
    };

    return { run };
};

export type ActionRunner = ReturnType<typeof createActionRunner>;
