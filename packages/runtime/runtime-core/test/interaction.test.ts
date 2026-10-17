import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DataStore, createActionRunner, createSession, resolveValue, lookupIn, type AgentEvent } from "../src/index";

const fx = (name: string) => JSON.parse(readFileSync(join(__dirname, `../../../../conformance/${name}.json`), "utf8"));

describe("conformance/bindings.json", () => {
    for (const c of fx("bindings").cases) {
        it(c.name, () => {
            const out = resolveValue(c.value, lookupIn(c.data));
            expect(out === undefined ? null : out).toEqual(c.expected);
            expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        });
    }
});

describe("conformance/actions.json", () => {
    for (const c of fx("actions").cases) {
        it(c.name, async () => {
            const data = new DataStore(c.data);
            const events: AgentEvent[] = [];
            const runner = createActionRunner({ data, onEmit: (e) => void events.push(e), allowedActions: c.allowedActions });
            const result = await runner.run(c.actions, { event: c.event });
            expect(data.snapshot()).toEqual(c.expectedData);
            expect(events.map((e) => ({ name: e.name, payload: e.payload }))).toEqual(c.expectedEvents);
            expect(result.errors.length).toBe(c.expectedErrors ?? 0);
        });
    }
});

describe("DataStore", () => {
    it("is immutable, versioned and notifies", () => {
        const s = new DataStore({ a: { b: 1 }, list: [1] });
        const before = s.snapshot();
        const spy = vi.fn();
        s.subscribe(spy);
        s.set("a.b", 2);
        s.set("list.1", 9);
        s.set("x.y.z", true);
        expect(before).toEqual({ a: { b: 1 }, list: [1] });
        expect(s.snapshot()).toEqual({ a: { b: 2 }, list: [1, 9], x: { y: { z: true } } });
        expect(s.version).toBe(3);
        expect(spy).toHaveBeenCalledTimes(3);
        expect(() => s.set("__proto__.x", 1)).toThrow();
    });

    it("applies RFC 6902 data patches without auto-creating p/c", () => {
        const s = new DataStore({ a: 1 });
        s.applyPatches([{ op: "add", path: "/b", value: 2 }, { op: "replace", path: "/a", value: 3 }]);
        expect(s.snapshot()).toEqual({ a: 3, b: 2 });
        expect(() => s.applyPatches([{ op: "add", path: "/p/x", value: 1 }])).toThrow();
    });
});

describe("RuntimeSession", () => {
    const doc = {
        version: "1.0.0",
        data: { form: { name: "" }, title: "Hello" },
        root: {
            t: "page",
            p: { title: { $bind: "title" } },
            c: [
                { t: "input", id: "name", p: { value: { $bind: "form.name" } } },
                { t: "button", id: "go", p: { label: "Send", onClick: { do: "submit", name: "send", from: "form" } } },
            ],
        },
    };

    it("resolves props, two-way binds and emits events", async () => {
        const events: AgentEvent[] = [];
        const s = createSession({ document: doc, onEmit: (e) => void events.push(e) });
        const [input, button] = s.tree!.root.children!;
        expect(s.resolveProps(s.tree!.root).title).toBe("Hello");
        expect(s.getBinding(input, "value")).toBe("form.name");
        expect(s.setBound(input, "value", "Ada")).toBe(true);
        expect(s.setBound(button, "label", "x")).toBe(false);
        expect(s.resolveProps(input).value).toBe("Ada");
        await s.dispatch(button, "onClick");
        expect(events[0]).toMatchObject({ name: "send", nodeId: "go", payload: { data: { name: "Ada" } } });
    });

    it("applies stream frames and notifies once per change", () => {
        const s = createSession({ document: doc });
        const spy = vi.fn();
        s.subscribe(spy);
        const v0 = s.version;
        expect(s.applyFrame({ type: "data", patches: [{ op: "replace", path: "/title", value: "Yo" }] })).toEqual({ ok: true });
        expect(s.resolveProps(s.tree!.root).title).toBe("Yo");
        expect(s.applyFrame({ type: "patch", patches: [{ op: "add", path: "/c/-", value: { t: "text", id: "t", p: { content: "x" } } }] })).toEqual({ ok: true });
        expect(s.tree!.root.children).toHaveLength(3);
        expect(s.version).toBeGreaterThan(v0);
        const bad = s.applyFrame({ type: "patch", patches: [{ op: "remove", path: "/c/99" }] });
        expect(bad.ok).toBe(false);
        expect(s.tree!.root.children).toHaveLength(3); // unchanged on failure
        expect(s.applyFrame({ type: "snapshot", document: { version: "1.0.0", root: { t: "page" } } })).toEqual({ ok: true });
        expect(s.tree!.root.children).toBeUndefined();
        expect(spy).toHaveBeenCalled();
    });
});
