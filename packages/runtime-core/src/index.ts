import { ASTDocument, UINode } from "@ainative-ui/ast";
import { ASTPatch } from "@ainative-ui/protocol";

export type RuntimeNode = UINode & {
    id: string; // Guaranteed to be defined in RuntimeNode
    parentId?: string;
    children?: RuntimeNode[];
};

export type RuntimeTree = {
    root: RuntimeNode;
    version: string;
};

// Generates a simple stable ID if not present
let idCounter = 0;
const generateId = (prefix: string = "node"): string => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${++idCounter}`;
};

// Deep clone helper
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Normalize nodes recursively, assigning stable IDs if missing
export const normalizeNode = (node: UINode, parentId?: string, index: number = 0): RuntimeNode => {
    const id = node.id || `node_${node.t}_${parentId ? parentId + "_" : ""}${index}`;
    const normalized: RuntimeNode = {
        id,
        t: node.t,
        p: node.p ? clone(node.p) : {},
        parentId,
    };

    if (node.c && node.c.length > 0) {
        normalized.children = node.c.map((child, idx) => normalizeNode(child, id, idx));
        // Keep the raw c array synced as well for standard AST compatibility
        normalized.c = normalized.children;
    }

    return normalized;
};

export const buildRuntimeTree = (document: ASTDocument): RuntimeTree => {
    return {
        root: normalizeNode(document.root),
        version: document.version,
    };
};

// Traverses a RuntimeNode and returns the node at a given JSON Pointer path
export const getNodeByPath = (root: RuntimeNode, path: string): RuntimeNode | null => {
    if (path === "" || path === "/") return root;
    const parts = path.split("/").filter(Boolean);
    
    let current: RuntimeNode = root;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === "c" || part === "children") {
            const nextPart = parts[++i];
            if (nextPart === undefined) return current;
            const index = parseInt(nextPart, 10);
            if (current.children && current.children[index]) {
                current = current.children[index];
            } else {
                return null;
            }
        } else {
            // Trying to access props or something else, but we want nodes
            return null;
        }
    }
    return current;
};

// Compares properties of two nodes and pushes replace patches
const diffProps = (path: string, oldProps: Record<string, unknown>, newProps: Record<string, unknown>, patches: ASTPatch[]) => {
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
    for (const key of allKeys) {
        const oldVal = oldProps[key];
        const newVal = newProps[key];

        if (oldVal === undefined && newVal !== undefined) {
            patches.push({ op: "add", path: `${path}/p/${key}`, value: newVal });
        } else if (oldVal !== undefined && newVal === undefined) {
            patches.push({ op: "remove", path: `${path}/p/${key}` });
        } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            patches.push({ op: "replace", path: `${path}/p/${key}`, value: newVal });
        }
    }
};

// Reconciles and diffs two trees recursively
export const diffRuntimeTree = (previous: RuntimeTree, next: RuntimeTree): ASTPatch[] => {
    const patches: ASTPatch[] = [];

    const diffNodes = (path: string, oldNode: RuntimeNode, newNode: RuntimeNode) => {
        // If type changed, we must replace the whole node
        if (oldNode.t !== newNode.t) {
            patches.push({ op: "replace", path, value: newNode });
            return;
        }

        // Diff props
        diffProps(path, oldNode.p || {}, newNode.p || {}, patches);

        // Diff children
        const oldChildren = oldNode.children || [];
        const newChildren = newNode.children || [];

        let i = 0;
        const maxLen = Math.max(oldChildren.length, newChildren.length);
        for (i = 0; i < maxLen; i++) {
            const childPath = `${path}/c/${i}`;
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];

            if (!oldChild && newChild) {
                patches.push({ op: "add", path: childPath, value: newChild });
            } else if (oldChild && !newChild) {
                patches.push({ op: "remove", path: childPath });
            } else if (oldChild && newChild) {
                // If IDs match or types match, diff recursively. Otherwise replace.
                if (oldChild.id === newChild.id || oldChild.t === newChild.t) {
                    diffNodes(childPath, oldChild, newChild);
                } else {
                    patches.push({ op: "replace", path: childPath, value: newChild });
                }
            }
        }
    };

    diffNodes("", previous.root, next.root);
    return patches;
};

// Applies a patch to a RuntimeTree and returns a new cloned & modified RuntimeTree
export const applyPatch = (tree: RuntimeTree, patch: ASTPatch): RuntimeTree => {
    const newTree = clone(tree);
    const { op, path, value } = patch;

    if (path === "" || path === "/") {
        if (op === "replace" && value) {
            newTree.root = value as RuntimeNode;
        }
        return newTree;
    }

    const parts = path.split("/").filter(Boolean);
    let current: Record<string, unknown> = newTree.root as unknown as Record<string, unknown>;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (part === "c" || part === "children") {
            const index = parseInt(parts[++i], 10);
            const children = current["children"] as Record<string, unknown>[];
            current = children[index];
        } else if (part === "p" || part === "props") {
            current = current["p"] as Record<string, unknown>;
        } else {
            current = current[part] as Record<string, unknown>;
        }
    }

    const lastPart = parts[parts.length - 1];

    if (parts.includes("p") || parts.includes("props")) {
        // Modifying property
        if (op === "add" || op === "replace") {
            current[lastPart] = value;
        } else if (op === "remove") {
            delete current[lastPart];
        }
    } else {
        // Modifying child nodes
        const parentPathParts = parts.slice(0, -1);
        let parentNode: Record<string, unknown> = newTree.root as unknown as Record<string, unknown>;
        for (let i = 0; i < parentPathParts.length; i++) {
            const part = parentPathParts[i];
            if (part === "c" || part === "children") {
                const index = parseInt(parentPathParts[++i], 10);
                const children = parentNode["children"] as Record<string, unknown>[];
                parentNode = children[index];
            }
        }

        const index = parseInt(lastPart, 10);
        if (!parentNode["children"]) {
            parentNode["children"] = [];
        }
        const children = parentNode["children"] as RuntimeNode[];

        if (op === "add") {
            children.splice(index, 0, value as RuntimeNode);
        } else if (op === "remove") {
            children.splice(index, 1);
        } else if (op === "replace") {
            children[index] = value as RuntimeNode;
        }
        parentNode["c"] = parentNode["children"]; // Keep c in sync
    }

    return newTree;
};

export const reconcile = (document: ASTDocument, currentTree?: RuntimeTree): RuntimeTree => {
    const nextTree = buildRuntimeTree(document);

    if (!currentTree) {
        return nextTree;
    }

    const patches = diffRuntimeTree(currentTree, nextTree);
    if (patches.length > 0) {
        let updated = currentTree;
        for (const patch of patches) {
            updated = applyPatch(updated, patch);
        }
        return updated;
    }

    return currentTree;
};

export const createRenderPayload = (tree: RuntimeTree) => ({
    type: "render",
    payload: tree,
});

