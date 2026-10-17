import { describe, expect, it } from "vitest";
import fc from "fast-check";
import type { UINode } from "@genui-protocol/ast";
import {
    PatchError,
    applyPatches,
    applyTreePatches,
    buildRuntimeTree,
    diffRuntimeTree,
    normalizeNode,
    reconcile,
    toAST,
} from "../src/index";

const doc = (root: UINode) => ({ version: "1.0.0", root });

describe("applyPatches (RFC 6902)", () => {
    const base: UINode = { t: "page", p: { title: "A" }, c: [{ t: "text", id: "x", p: { content: "hi" } }] };

    it("add / replace / remove props", () => {
        const out = applyPatches(base, [
            { op: "add", path: "/p/subtitle", value: "S" },
            { op: "replace", path: "/p/title", value: "B" },
            { op: "remove", path: "/c/0/p/content" },
        ]);
        expect(out.p).toEqual({ title: "B", subtitle: "S" });
        expect(out.c![0].p).toEqual({});
    });

    it("does not mutate the input", () => {
        const copy = JSON.parse(JSON.stringify(base));
        applyPatches(base, [{ op: "replace", path: "/p/title", value: "Z" }]);
        expect(base).toEqual(copy);
    });

    it("supports move, copy, test and '-' append", () => {
        const out = applyPatches(
            { t: "stack", c: [{ t: "a" }, { t: "b" }, { t: "c" }] },
            [
                { op: "move", from: "/c/2", path: "/c/0" },
                { op: "copy", from: "/c/0", path: "/c/-" },
                { op: "test", path: "/c/0/t", value: "c" },
            ]
        );
        expect(out.c!.map((n) => n.t)).toEqual(["c", "a", "b", "c"]);
    });

    it("escapes ~ and / in keys", () => {
        const out = applyPatches({ t: "x", p: {} }, [{ op: "add", path: "/p/a~1b~0c", value: 1 }]);
        expect(out.p).toEqual({ "a/b~c": 1 });
    });

    it("is atomic and reports errors instead of corrupting", () => {
        expect(() => applyPatches(base, [{ op: "replace", path: "/p/title", value: "Z" }, { op: "remove", path: "/c/9" }])).toThrow(PatchError);
        expect(() => applyPatches(base, [{ op: "test", path: "/p/title", value: "nope" }])).toThrow(PatchError);
        expect(() => applyPatches(base, [{ op: "replace", path: "/p/missing", value: 1 }])).toThrow(PatchError);
        expect(() => applyPatches(base, [{ op: "remove", path: "" }])).toThrow(PatchError);
        expect(() => applyPatches(base, [{ op: "move", from: "/c/0", path: "/c/0/c/0" }])).toThrow(PatchError);
    });

    it("rejects prototype-pollution paths", () => {
        expect(() => applyPatches(base, [{ op: "add", path: "/p/__proto__/polluted", value: 1 }])).toThrow(PatchError);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("creates a missing props object on add", () => {
        expect(applyPatches({ t: "x" }, [{ op: "add", path: "/p/a", value: 1 }]).p).toEqual({ a: 1 });
    });
});

describe("diffRuntimeTree", () => {
    const tree = (root: UINode) => buildRuntimeTree(doc(root));

    it("emits nothing for identical trees", () => {
        const t = { t: "page", p: { a: 1 }, c: [{ t: "text", id: "x" }] };
        expect(diffRuntimeTree(tree(t), tree(t))).toEqual([]);
    });

    it("turns a reorder of id'd children into moves, not replacements", () => {
        const mk = (ids: string[]) => ({ t: "stack", c: ids.map((id) => ({ t: "text", id, p: { content: id } })) });
        const patches = diffRuntimeTree(tree(mk(["a", "b", "c"])), tree(mk(["c", "a", "b"])));
        expect(patches).toEqual([{ op: "move", from: "/c/2", path: "/c/0" }]);
    });

    it("inserting at the front leaves siblings untouched", () => {
        const mk = (ids: string[]) => ({ t: "stack", c: ids.map((id) => ({ t: "text", id, p: { content: id } })) });
        const patches = diffRuntimeTree(tree(mk(["a", "b"])), tree(mk(["z", "a", "b"])));
        expect(patches).toEqual([{ op: "add", path: "/c/0", value: { t: "text", id: "z", p: { content: "z" } } }]);
    });

    it("replaces a node whose type changed and keeps wire values free of runtime fields", () => {
        const patches = diffRuntimeTree(tree({ t: "stack", c: [{ t: "text", id: "a" }] }), tree({ t: "stack", c: [{ t: "badge", id: "a" }] }));
        expect(patches).toEqual([{ op: "replace", path: "/c/0", value: { t: "badge", id: "a" } }]);
    });
});

describe("reconcile", () => {
    it("returns the same tree reference when nothing changed", () => {
        const d = doc({ t: "page", p: { a: 1 } });
        const t = reconcile(d);
        expect(reconcile(d, t)).toBe(t);
    });
});

// ---- property tests -------------------------------------------------------

const TYPES = ["text", "card", "stack", "badge"];
const propsArb = fc.dictionary(fc.constantFrom("a", "b", "c/d", "e~f"), fc.oneof(fc.string({ maxLength: 4 }), fc.integer(), fc.boolean(), fc.constant(null)), { maxKeys: 3 });

const nodeArb = (depth: number): fc.Arbitrary<UINode> =>
    fc.letrec<{ node: UINode }>((tie) => ({
        node: fc.record(
            {
                t: fc.constantFrom(...TYPES),
                id: fc.option(fc.constantFrom("n1", "n2", "n3", "n4", "n5", "n6"), { nil: undefined }),
                p: fc.option(propsArb, { nil: undefined }),
                c: depth > 0 ? fc.option(fc.array(tie("node"), { maxLength: 4 }), { nil: undefined }) : fc.constant(undefined),
            },
            { requiredKeys: ["t"] }
        ),
    })).node as fc.Arbitrary<UINode>;

const clean = (n: UINode): UINode => JSON.parse(JSON.stringify(n));

describe("properties", () => {
    it("apply(diff(a, b), a) ≡ b", () => {
        fc.assert(
            fc.property(nodeArb(3), nodeArb(3), (a, b) => {
                const ta = buildRuntimeTree(doc(clean(a)));
                const tb = buildRuntimeTree(doc(clean(b)));
                const patches = diffRuntimeTree(ta, tb);
                const result = applyTreePatches(ta, patches);
                expect(toAST(result.root)).toEqual(toAST(tb.root));
            }),
            { numRuns: 500 }
        );
    });

    it("normalize is idempotent", () => {
        fc.assert(
            fc.property(nodeArb(3), (a) => {
                const once = normalizeNode(clean(a));
                const twice = normalizeNode(toAST(once));
                expect(toAST(twice)).toEqual(toAST(once));
            }),
            { numRuns: 200 }
        );
    });

    it("patches survive JSON serialization", () => {
        fc.assert(
            fc.property(nodeArb(2), nodeArb(2), (a, b) => {
                const ta = buildRuntimeTree(doc(clean(a)));
                const tb = buildRuntimeTree(doc(clean(b)));
                const patches = JSON.parse(JSON.stringify(diffRuntimeTree(ta, tb)));
                expect(toAST(applyTreePatches(ta, patches).root)).toEqual(toAST(tb.root));
            }),
            { numRuns: 200 }
        );
    });
});
