import { describe, expect, it } from "vitest";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { createValidator, isSafeUrl, validateDocument, validateNode } from "../src/index";

describe("validateDocument", () => {
    it("accepts a valid document", () => {
        const r = validateDocument({ version: "1.0.0", root: { t: "page", p: { title: "Hi" } } });
        expect(r).toEqual({ valid: true });
    });

    it("rejects malformed envelopes and unsupported majors", () => {
        expect(validateDocument(null).valid).toBe(false);
        expect(validateDocument({ root: { t: "page" } }).valid).toBe(false);
        expect(validateDocument({ version: "banana", root: { t: "page" } }).valid).toBe(false);
        const r = validateDocument({ version: "2.0.0", root: { t: "page", p: { title: "x" } } });
        expect(r.valid).toBe(false);
        expect(r.errors![0]).toMatch(/Unsupported protocol version/);
    });
});

describe("validateNode", () => {
    it("reports unknown components and bad props with paths", () => {
        const r = validateNode({ t: "page", p: { title: "x" }, c: [{ t: "nope" }, { t: "text", p: { content: 5 } }] });
        expect(r.valid).toBe(false);
        expect(r.errors!.join("\n")).toMatch(/\/root\/c\/0.*Unknown component type: "nope"/);
    });

    it("every registry example validates against its own schema", () => {
        const registry = new ComponentRegistry();
        for (const entry of registry.list()) {
            for (const example of entry.examples ?? []) {
                const r = createValidator({ registry }).validateNodeProps(example);
                expect(r, `${entry.name} example`).toEqual({ valid: true });
            }
        }
    });

    it("rejects duplicate ids", () => {
        const r = validateNode({ t: "page", p: { title: "x" }, c: [{ t: "text", id: "a", p: { content: "1" } }, { t: "text", id: "a", p: { content: "2" } }] });
        expect(r.errors!.join()).toMatch(/duplicate node id "a"/);
    });

    it("enforces depth and node limits without blowing the stack", () => {
        let deep: any = { t: "stack" };
        for (let i = 0; i < 100_000; i++) deep = { t: "stack", c: [deep] };
        expect(validateNode(deep).errors![0]).toMatch(/maximum depth/);

        const wide = { t: "stack", c: Array.from({ length: 6000 }, () => ({ t: "stack" })) };
        expect(validateNode(wide).errors![0]).toMatch(/maximum of 5000 nodes/);
    });

    it("blocks dangerous URL schemes and oversized strings", () => {
        const v = createValidator({ limits: { maxStringLength: 10 } });
        expect(v.validateNode({ t: "text", p: { content: "x".repeat(11) } }).errors!.join()).toMatch(/string length/);
        expect(isSafeUrl("javascript:alert(1)")).toBe(false);
        expect(isSafeUrl(" JaVa\tScRiPt:alert(1)")).toBe(false);
        expect(isSafeUrl("data:text/html,<script>")).toBe(false);
        expect(isSafeUrl("https://example.com")).toBe(true);
        expect(isSafeUrl("/relative/path?x=1")).toBe(true);
        expect(isSafeUrl("mailto:a@b.co")).toBe(true);
    });

    it("supports a per-validator allow-list and custom registries", () => {
        const v = createValidator({ allowedComponents: ["page"] });
        expect(v.validateNode({ t: "page", p: { title: "x" }, c: [{ t: "text", p: { content: "y" } }] }).errors!.join()).toMatch(/"text" is not allowed/);
        const empty = createValidator({ registry: new ComponentRegistry([]) });
        expect(empty.validateNode({ t: "page", p: { title: "x" } }).errors![0]).toMatch(/Unknown component/);
    });

    it("checks renderer support", () => {
        const r = validateNode({ t: "section", p: { title: "x" } }, "flutter");
        expect(r.valid).toBe(false);
    });
});
