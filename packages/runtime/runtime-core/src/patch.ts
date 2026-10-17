import { ASTPatch } from "@genui-protocol/protocol";
import { UINode } from "@genui-protocol/ast";
import { parsePointer } from "./pointer.js";

export class PatchError extends Error {
    constructor(message: string, public readonly patch?: ASTPatch) {
        super(message);
        this.name = "PatchError";
    }
}

type Json = unknown;
type Container = Record<string, Json> | Json[];

const isObject = (v: unknown): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);

export const deepEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        return a.every((v, i) => deepEqual(v, b[i]));
    }
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => k in (b as object) && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

export const cloneJson = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const arrayIndex = (token: string, length: number, allowEnd: boolean, patch: ASTPatch): number => {
    if (allowEnd && token === "-") return length;
    if (!/^(0|[1-9]\d*)$/.test(token)) throw new PatchError(`Invalid array index "${token}"`, patch);
    const index = Number(token);
    if (index > length || (!allowEnd && index === length)) {
        throw new PatchError(`Array index ${index} out of bounds (length ${length})`, patch);
    }
    return index;
};

/** Resolves the container that holds the last token of `tokens`. On `add`, a missing `p` object or `c` array is created. */
const resolveParent = (doc: { root: Json }, tokens: string[], patch: ASTPatch): Container => {
    let current: Json = doc.root;
    for (let i = 0; i < tokens.length - 1; i++) {
        const token = tokens[i];
        if (FORBIDDEN_KEYS.has(token)) throw new PatchError(`Forbidden path token "${token}"`, patch);
        if (Array.isArray(current)) {
            current = current[arrayIndex(token, current.length, false, patch)];
        } else if (isObject(current)) {
            if (!(token in current) && patch.op === "add" && (token === "p" || token === "c")) current[token] = token === "p" ? {} : [];
            if (!(token in current)) throw new PatchError(`Path segment "${token}" does not exist`, patch);
            current = current[token];
        } else {
            throw new PatchError(`Cannot traverse into primitive at "${token}"`, patch);
        }
    }
    if (typeof current !== "object" || current === null) throw new PatchError("Parent of target is not a container", patch);
    return current as Container;
};

const getValue = (doc: { root: Json }, tokens: string[], patch: ASTPatch): Json => {
    if (tokens.length === 0) return doc.root;
    const parent = resolveParent(doc, tokens, patch);
    const last = tokens[tokens.length - 1];
    if (Array.isArray(parent)) return parent[arrayIndex(last, parent.length, false, patch)];
    if (!(last in parent)) throw new PatchError(`Path segment "${last}" does not exist`, patch);
    return parent[last];
};

const addAt = (doc: { root: Json }, tokens: string[], value: Json, patch: ASTPatch) => {
    if (tokens.length === 0) {
        doc.root = value;
        return;
    }
    const parent = resolveParent(doc, tokens, patch);
    const last = tokens[tokens.length - 1];
    if (FORBIDDEN_KEYS.has(last)) throw new PatchError(`Forbidden path token "${last}"`, patch);
    if (Array.isArray(parent)) parent.splice(arrayIndex(last, parent.length, true, patch), 0, value);
    else parent[last] = value;
};

const removeAt = (doc: { root: Json }, tokens: string[], patch: ASTPatch): Json => {
    if (tokens.length === 0) throw new PatchError("Cannot remove the document root", patch);
    const parent = resolveParent(doc, tokens, patch);
    const last = tokens[tokens.length - 1];
    if (Array.isArray(parent)) return parent.splice(arrayIndex(last, parent.length, false, patch), 1)[0];
    if (!(last in parent)) throw new PatchError(`Path segment "${last}" does not exist`, patch);
    const old = parent[last];
    delete parent[last];
    return old;
};

const applyOne = (doc: { root: Json }, patch: ASTPatch) => {
    const tokens = parsePointer(patch.path);
    switch (patch.op) {
        case "add":
            addAt(doc, tokens, cloneJson(patch.value), patch);
            break;
        case "remove":
            removeAt(doc, tokens, patch);
            break;
        case "replace": {
            if (tokens.length === 0) {
                doc.root = cloneJson(patch.value);
                break;
            }
            const parent = resolveParent(doc, tokens, patch);
            const last = tokens[tokens.length - 1];
            if (Array.isArray(parent)) parent[arrayIndex(last, parent.length, false, patch)] = cloneJson(patch.value);
            else if (last in parent && !FORBIDDEN_KEYS.has(last)) parent[last] = cloneJson(patch.value);
            else throw new PatchError(`Path segment "${last}" does not exist`, patch);
            break;
        }
        case "move": {
            if (patch.from === undefined) throw new PatchError('"move" requires "from"', patch);
            const from = parsePointer(patch.from);
            if (tokens.length > from.length && from.every((t, i) => tokens[i] === t)) {
                throw new PatchError('"move" target cannot be inside its source', patch);
            }
            const moved = removeAt(doc, from, patch);
            addAt(doc, tokens, moved, patch);
            break;
        }
        case "copy": {
            if (patch.from === undefined) throw new PatchError('"copy" requires "from"', patch);
            addAt(doc, tokens, cloneJson(getValue(doc, parsePointer(patch.from), patch)), patch);
            break;
        }
        case "test":
            if (!deepEqual(getValue(doc, tokens, patch), patch.value)) throw new PatchError(`"test" failed at "${patch.path}"`, patch);
            break;
        default:
            throw new PatchError(`Unknown patch op "${(patch as ASTPatch).op}"`, patch);
    }
};

/**
 * Applies RFC 6902 patches to a plain AST node (paths are JSON Pointers into the node: `/c/0/p/label`).
 * The input is never mutated. The batch is atomic: any failure throws a PatchError and nothing is returned.
 */
export const applyPatches = (root: UINode, patches: ASTPatch[]): UINode => {
    const doc = { root: cloneJson(root) as Json };
    for (const patch of patches) applyOne(doc, patch);
    return doc.root as UINode;
};
