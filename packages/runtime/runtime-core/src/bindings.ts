import { BindExpr, TemplateExpr, isActionProp } from "@genui-protocol/protocol";
import { getAtPath, parseDataPath } from "./data.js";

/** Looks up a path in the current scope. `$event.*` and other scope variables are provided by the caller. */
export type Lookup = (path: string) => unknown;

const MAX_DEPTH = 32;
const MAX_TEMPLATE_LENGTH = 100_000;

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export const isBind = (v: unknown): v is BindExpr =>
    isPlainObject(v) && typeof v["$bind"] === "string" && Object.keys(v).every((k) => k === "$bind" || k === "default");

export const isTemplate = (v: unknown): v is TemplateExpr =>
    isPlainObject(v) && typeof v["$tpl"] === "string" && Object.keys(v).length === 1;

export const lookupIn = (data: unknown, scope: Record<string, unknown> = {}): Lookup => (path) => {
    const tokens = parseDataPath(path);
    if (tokens[0] !== undefined && tokens[0].startsWith("$") && tokens[0] in scope) return getAtPath(scope[tokens[0]], tokens.slice(1));
    return getAtPath(data, tokens);
};

const stringify = (v: unknown): string => (v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));

export const interpolate = (template: string, lookup: Lookup): string => {
    if (template.length > MAX_TEMPLATE_LENGTH) return "";
    return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_m, path: string) => stringify(lookup(path)));
};

/** Recursively resolves `$bind` / `$tpl` expressions in a prop value. */
export const resolveValue = (value: unknown, lookup: Lookup, depth = 0): unknown => {
    if (depth > MAX_DEPTH) return undefined;
    if (isBind(value)) {
        const found = lookup(value.$bind);
        return found === undefined ? value.default : found;
    }
    if (isTemplate(value)) return interpolate(value.$tpl, lookup);
    if (Array.isArray(value)) return value.map((v) => resolveValue(v, lookup, depth + 1));
    if (isPlainObject(value)) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v, lookup, depth + 1);
        return out;
    }
    return value;
};

/**
 * Resolves bindings in a node's props. Action props (`onClick`, ...) are left untouched:
 * they are resolved when they run, so they see the data as it is at that moment.
 */
export const resolveProps = (props: Record<string, unknown> | undefined, data: unknown): Record<string, unknown> => {
    if (!props) return {};
    const lookup = lookupIn(data);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) out[k] = isActionProp(k) ? v : resolveValue(v, lookup);
    return out;
};

/** If `value` is a pure `$bind`, returns its data path (used for two-way binding on inputs). */
export const getBindPath = (value: unknown): string | null => (isBind(value) ? value.$bind : null);
