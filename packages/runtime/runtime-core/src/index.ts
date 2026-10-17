import { ASTDocument, UINode } from "@genui-protocol/ast";
import { ASTPatch } from "@genui-protocol/protocol";
import { applyPatches, cloneJson, deepEqual } from "./patch.js";
import { buildPointer, escapePointerToken, parsePointer } from "./pointer.js";

export { applyPatches, applyJsonPatch, PatchError, deepEqual, cloneJson } from "./patch.js";
export { DataStore, parseDataPath, getAtPath } from "./data.js";
export { resolveProps, resolveValue, interpolate, isBind, isTemplate, getBindPath, lookupIn } from "./bindings.js";
export { createActionRunner } from "./actions.js";
export type { AgentEvent, ActionRunnerOptions, ActionContext, ActionResult, ActionRunner } from "./actions.js";
export { RuntimeSession, createSession } from "./session.js";
export type { SessionOptions, FrameResult } from "./session.js";
export { buildPointer, escapePointerToken, unescapePointerToken, parsePointer } from "./pointer.js";

export type RuntimeNode = UINode & {
    id: string; // Guaranteed to be defined in RuntimeNode
    parentId?: string;
    /** True when `id` was derived by the runtime (not supplied by the AST author). */
    autoId?: boolean;
    children?: RuntimeNode[];
};

export type RuntimeTree = {
    root: RuntimeNode;
    version: string;
};

// Normalize nodes recursively. Nodes without an explicit id get a deterministic, position-based id.
// Give dynamic lists explicit ids: position-based ids shift when siblings are inserted or removed.
export const normalizeNode = (node: UINode, parentId?: string, index: number = 0): RuntimeNode => {
    const autoId = !node.id;
    const id = node.id || `node_${node.t}_${parentId ? parentId + "_" : ""}${index}`;
    const normalized: RuntimeNode = {
        id,
        t: node.t,
        p: node.p ? cloneJson(node.p) : {},
        parentId,
    };
    if (autoId) normalized.autoId = true;

    if (node.c && node.c.length > 0) {
        normalized.children = node.c.map((child, idx) => normalizeNode(child, id, idx));
        // Keep the raw c array synced as well for standard AST compatibility
        normalized.c = normalized.children;
    }

    return normalized;
};

export const buildRuntimeTree = (document: ASTDocument): RuntimeTree => ({
    root: normalizeNode(document.root),
    version: document.version,
});

/** Strips runtime-only fields, producing the plain wire-format AST node. */
export const toAST = (node: RuntimeNode): UINode => {
    const out: UINode = { t: node.t };
    if (!node.autoId) out.id = node.id;
    if (node.p && Object.keys(node.p).length > 0) out.p = cloneJson(node.p);
    if (node.children && node.children.length > 0) out.c = node.children.map(toAST);
    return out;
};

// Returns the node at a JSON Pointer path made of `/c/<index>` segments.
export const getNodeByPath = (root: RuntimeNode, path: string): RuntimeNode | null => {
    const parts = parsePointer(path);
    let current: RuntimeNode = root;
    for (let i = 0; i < parts.length; i += 2) {
        if (parts[i] !== "c" || parts[i + 1] === undefined) return null;
        const next = current.children?.[Number(parts[i + 1])];
        if (!next) return null;
        current = next;
    }
    return current;
};

const diffProps = (path: string, oldProps: Record<string, unknown>, newProps: Record<string, unknown>, patches: ASTPatch[]) => {
    for (const key of new Set([...Object.keys(oldProps), ...Object.keys(newProps)])) {
        const oldVal = oldProps[key];
        const newVal = newProps[key];
        const propPath = `${path}/p/${escapePointerToken(key)}`;

        if (oldVal === undefined && newVal !== undefined) patches.push({ op: "add", path: propPath, value: newVal });
        else if (oldVal !== undefined && newVal === undefined) patches.push({ op: "remove", path: propPath });
        else if (!deepEqual(oldVal, newVal)) patches.push({ op: "replace", path: propPath, value: newVal });
    }
};

const hasUniqueIds = (nodes: RuntimeNode[]) => new Set(nodes.map((n) => n.id)).size === nodes.length;

/**
 * Produces RFC 6902 patches turning `previous` into `next`. Children are matched by id, so reorders
 * become `move` ops and insertions/removals do not disturb unrelated siblings.
 * Patches must be applied in order (each path refers to the tree state after the previous patch).
 */
export const diffRuntimeTree = (previous: RuntimeTree, next: RuntimeTree): ASTPatch[] => {
    const patches: ASTPatch[] = [];

    const diffNodes = (path: string, oldNode: RuntimeNode, newNode: RuntimeNode) => {
        if (oldNode.t !== newNode.t || oldNode.id !== newNode.id) {
            patches.push({ op: "replace", path, value: toAST(newNode) });
            return;
        }

        diffProps(path, oldNode.p || {}, newNode.p || {}, patches);
        diffChildren(path, oldNode.children || [], newNode.children || []);
    };

    const diffChildren = (path: string, oldKids: RuntimeNode[], newKids: RuntimeNode[]) => {
        if (oldKids.length === 0 && newKids.length === 0) return;

        if (!hasUniqueIds(oldKids) || !hasUniqueIds(newKids)) {
            // Ambiguous identity: fall back to positional comparison.
            const max = Math.max(oldKids.length, newKids.length);
            for (let i = max - 1; i >= newKids.length; i--) patches.push({ op: "remove", path: `${path}/c/${i}` });
            for (let i = 0; i < newKids.length; i++) {
                if (i >= oldKids.length) patches.push({ op: "add", path: `${path}/c/${i}`, value: toAST(newKids[i]) });
                else diffNodes(`${path}/c/${i}`, oldKids[i], newKids[i]);
            }
            return;
        }

        const newIds = new Set(newKids.map((n) => n.id));
        let current = [...oldKids];

        for (let i = current.length - 1; i >= 0; i--) {
            if (!newIds.has(current[i].id)) {
                patches.push({ op: "remove", path: `${path}/c/${i}` });
                current.splice(i, 1);
            }
        }

        for (let j = 0; j < newKids.length; j++) {
            const target = newKids[j];
            if (current[j]?.id !== target.id) {
                const from = current.findIndex((n) => n.id === target.id);
                if (from === -1) {
                    patches.push({ op: "add", path: `${path}/c/${j}`, value: toAST(target) });
                    current.splice(j, 0, target);
                    continue;
                }
                patches.push({ op: "move", from: `${path}/c/${from}`, path: `${path}/c/${j}` });
                const [moved] = current.splice(from, 1);
                current.splice(j, 0, moved);
            }
            diffNodes(`${path}/c/${j}`, current[j], target);
        }
    };

    diffNodes("", previous.root, next.root);
    return patches;
};

const treeFromAST = (root: UINode, version: string): RuntimeTree => ({ root: normalizeNode(root), version });

/** Applies a batch of patches (atomically) to a RuntimeTree and returns a new RuntimeTree. */
export const applyTreePatches = (tree: RuntimeTree, patches: ASTPatch[]): RuntimeTree =>
    treeFromAST(applyPatches(toAST(tree.root), patches), tree.version);

export const applyPatch = (tree: RuntimeTree, patch: ASTPatch): RuntimeTree => applyTreePatches(tree, [patch]);

export const reconcile = (document: ASTDocument, currentTree?: RuntimeTree): RuntimeTree => {
    const nextTree = buildRuntimeTree(document);
    if (!currentTree) return nextTree;
    return diffRuntimeTree(currentTree, nextTree).length === 0 ? currentTree : nextTree;
};

export const createRenderPayload = (tree: RuntimeTree) => ({
    type: "render",
    payload: tree,
});

export { buildPointer as pointerFromTokens };
