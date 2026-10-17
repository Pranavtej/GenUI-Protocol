export const PROTOCOL_VERSION = "1.0.0";

export type RendererKey =
    | "react"
    | "angular"
    | "vue"
    | "svelte"
    | "react-native"
    | "swiftui"
    | "flutter";

export type ComponentSupport = {
    name: string;
    version: string;
    renderers: RendererKey[];
};

export type ASTPatch = {
    op: "add" | "remove" | "replace" | "move" | "copy" | "test";
    path: string;
    value?: unknown;
    from?: string;
};

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

/** Built-in types are bare camelCase names (`kpi`); custom components are namespaced (`acme:gauge`). */
export const COMPONENT_TYPE_PATTERN = /^[a-z][A-Za-z0-9]*(:[A-Za-z][A-Za-z0-9_-]*)?$/;
export const isValidComponentType = (t: string): boolean => t.length <= 64 && COMPONENT_TYPE_PATTERN.test(t);
export const isCustomComponentType = (t: string): boolean => t.includes(":");

// ---------------------------------------------------------------------------
// Data binding expressions
// ---------------------------------------------------------------------------

/** Resolves to the value at `$bind` in the data model (dot path `a.b.0` or JSON Pointer `/a/b/0`). */
export type BindExpr = { $bind: string; default?: unknown };
/** String interpolation: `"Hello {{user.name}}"`. Only data lookups — no expressions, no code. */
export type TemplateExpr = { $tpl: string };

// ---------------------------------------------------------------------------
// Actions: declarative, side-effect descriptions. Never code.
// ---------------------------------------------------------------------------

export type Action =
    | { do: "setData"; path: string; value: unknown }
    | { do: "toggle"; path: string }
    | { do: "navigate"; to: string }
    | { do: "emit"; name: string; payload?: Record<string, unknown> }
    | { do: "submit"; name: string; from: string };

export type ActionKind = Action["do"];
export const ACTION_KINDS: ActionKind[] = ["setData", "toggle", "navigate", "emit", "submit"];
export const MAX_ACTIONS_PER_EVENT = 20;

/** Prop names that hold actions: `onClick`, `onChange`, ... */
export const isActionProp = (name: string): boolean => /^on[A-Z]/.test(name);

const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/** True when `value` is a relative reference or uses an allowed scheme (no javascript:, data:, vbscript:, ...). */
export const isSafeUrl = (value: string): boolean => {
    // Browsers ignore whitespace/control characters inside a scheme ("java\tscript:"), so strip them first.
    // eslint-disable-next-line no-control-regex
    const cleaned = value.replace(/[\u0000- \u007f-\u009f]/g, "");
    const match = /^([a-zA-Z][a-zA-Z0-9+.-]*:)/.exec(cleaned);
    if (!match) return true; // relative URL, fragment, query
    return SAFE_URL_SCHEMES.has(match[1].toLowerCase());
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmptyString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** Returns a list of problems with `action` (empty = valid). */
type LooseAction = { do: string; path?: unknown; value?: unknown; to?: unknown; name?: unknown; payload?: unknown; from?: unknown };

export const validateAction = (input: unknown): string[] => {
    if (!isRecord(input) || typeof input["do"] !== "string") return ['Action must be an object with a "do" field'];
    const action = input as LooseAction;
    const allowedKeys: Record<string, string[]> = {
        setData: ["do", "path", "value"],
        toggle: ["do", "path"],
        navigate: ["do", "to"],
        emit: ["do", "name", "payload"],
        submit: ["do", "name", "from"],
    };
    const keys = allowedKeys[action.do];
    if (!keys) return [`Unknown action "${action.do}"`];
    const errors: string[] = [];
    for (const k of Object.keys(action)) if (!keys.includes(k)) errors.push(`Action "${action.do}" has unknown field "${k}"`);
    switch (action.do) {
        case "setData":
            if (!nonEmptyString(action.path)) errors.push('setData requires a non-empty "path"');
            if (!("value" in action)) errors.push('setData requires "value"');
            break;
        case "toggle":
            if (!nonEmptyString(action.path)) errors.push('toggle requires a non-empty "path"');
            break;
        case "navigate":
            if (!nonEmptyString(action.to)) errors.push('navigate requires a non-empty "to"');
            else if (!isSafeUrl(action.to)) errors.push("navigate uses a disallowed URL scheme");
            break;
        case "emit":
            if (!nonEmptyString(action.name)) errors.push('emit requires a non-empty "name"');
            if (action.payload !== undefined && !isRecord(action.payload)) errors.push('emit "payload" must be an object');
            break;
        case "submit":
            if (!nonEmptyString(action.name)) errors.push('submit requires a non-empty "name"');
            if (!nonEmptyString(action.from)) errors.push('submit requires a non-empty "from" (data path)');
            break;
    }
    return errors;
};

/** Normalizes an action-valued prop (single action or array) into a list. */
export const toActionList = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]);

// ---------------------------------------------------------------------------
// Streaming frames
// ---------------------------------------------------------------------------

export type DocumentLike = { version: string; root: unknown; data?: Record<string, unknown> };

/**
 * Frames sent from a producer to a consumer. `sequence` is strictly increasing per stream (starting at 1);
 * frames without a sequence are applied immediately (legacy producers).
 */
export type StreamFrame =
    | { type: "snapshot"; sequence?: number; document: DocumentLike }
    | { type: "patch"; sequence?: number; patches: ASTPatch[]; dataPatches?: ASTPatch[] }
    | { type: "data"; sequence?: number; patches: ASTPatch[] }
    | { type: "error"; sequence?: number; message: string; code?: string }
    /** Legacy alias for a snapshot. */
    | { type: "ast"; sequence?: number; ast: DocumentLike };
