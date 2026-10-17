import { describe, expect, it } from "vitest";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { validateDocument } from "@genui-protocol/validation";
import { ACTION_KINDS } from "@genui-protocol/protocol";
import { FEW_SHOTS, TOOLS, buildSystemPrompt, componentCatalogue, toAnthropicTools, toMcpTools, toOpenAITools } from "../src/index";

describe("prompt-kit", () => {
    it("every few-shot example is a valid document", () => {
        for (const shot of FEW_SHOTS) {
            expect(validateDocument(shot.document), shot.request).toEqual({ valid: true });
        }
    });

    it("the catalogue lists every registered component and marks required props", () => {
        const registry = new ComponentRegistry();
        const catalogue = componentCatalogue(registry);
        for (const e of registry.list()) expect(catalogue).toContain(`- ${e.id} —`);
        expect(catalogue).toMatch(/- kpi — .*label\*:string/);
    });

    it("reflects custom components registered by the host", () => {
        const registry = new ComponentRegistry();
        registry.registerCustom({ id: "acme:gauge", category: "data", renderers: ["react"], schema: { type: "object", properties: { value: { type: "number" } }, required: ["value"] } });
        expect(buildSystemPrompt({ registry })).toContain("acme:gauge");
    });

    it("documents every action kind and the binding syntax", () => {
        const prompt = buildSystemPrompt({ fewShots: false });
        for (const kind of ACTION_KINDS) expect(prompt).toContain(`"do": "${kind}"`);
        expect(prompt).toContain("$bind");
        expect(prompt).toContain("$tpl");
        expect(prompt).not.toContain("# Examples");
    });

    it("tool definitions convert to each provider shape", () => {
        expect(TOOLS.map((t) => t.name)).toEqual(["render_ui", "validate_ui", "patch_ui"]);
        expect(toAnthropicTools()[0]).toHaveProperty("input_schema");
        expect(toOpenAITools()[0]).toMatchObject({ type: "function", function: { name: "render_ui" } });
        expect(toMcpTools()[0]).toHaveProperty("inputSchema");
    });
});
