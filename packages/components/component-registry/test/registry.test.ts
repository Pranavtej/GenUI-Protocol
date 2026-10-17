import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ComponentRegistry } from "../src/index";

describe("registry", () => {
    it("every component has a schema, renderers and a valid example shape", () => {
        for (const e of new ComponentRegistry().list()) {
            expect(e.schema, e.id).toMatchObject({ type: "object" });
            expect(e.renderers?.length, e.id).toBeGreaterThan(0);
            for (const ex of e.examples ?? []) expect(ex.t, e.id).toBe(e.id);
        }
    });

    it("search and registerCustom behave", () => {
        const r = new ComponentRegistry();
        expect(r.search("chart").map((e) => e.id)).toContain("chart");
        expect(() => r.registerCustom({ id: "kpi", category: "data", renderers: [], schema: {} })).toThrow(/namespaced/);
        r.registerCustom({ id: "acme:x", category: "data", renderers: ["react"], schema: { type: "object" } });
        expect(r.get("acme:x")?.version).toBe("1.0.0");
        expect(() => r.registerCustom({ id: "acme:x", category: "data", renderers: [], schema: {} })).toThrow(/already/);
    });

    it("the Python SDK's bundled registry.json is in sync (run `pnpm emit:registry`)", () => {
        const bundled = JSON.parse(readFileSync(join(__dirname, "../../../sdk/python/genui_protocol_sdk/registry.json"), "utf8"));
        const current = new ComponentRegistry().list().map(({ id, name, version, category, description, renderers, events, schema }) => ({ id, name, version, category, description, renderers, events, schema }));
        expect(bundled).toEqual(JSON.parse(JSON.stringify(current)));
    });
});
