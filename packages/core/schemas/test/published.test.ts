import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import { publishedSchemas } from "../src/index";

const specDir = join(__dirname, "../../../../spec/schemas");

describe("published schemas", () => {
    it("spec/schemas is in sync with the source (run `pnpm --filter @genui-protocol/schemas emit`)", () => {
        for (const [file, schema] of Object.entries(publishedSchemas)) {
            expect(JSON.parse(readFileSync(join(specDir, file), "utf8")), file).toEqual(JSON.parse(JSON.stringify(schema)));
        }
    });

    it("compile together and validate documents, patches and events", () => {
        const ajv = new Ajv2020({ strict: false });
        for (const s of Object.values(publishedSchemas)) ajv.addSchema(s);
        const doc = ajv.getSchema("https://genui-protocol.dev/schemas/v1/document.json")!;
        const patch = ajv.getSchema("https://genui-protocol.dev/schemas/v1/patch.json")!;
        const event = ajv.getSchema("https://genui-protocol.dev/schemas/v1/stream-event.json")!;

        expect(doc({ version: "1.0.0", root: { t: "page", c: [{ t: "text", p: { content: "x" } }] } })).toBe(true);
        expect(doc({ version: "1.0.0", root: { t: "page", c: [{ p: {} }] } })).toBe(false);
        expect(patch({ op: "replace", path: "/p/a", value: 1 })).toBe(true);
        expect(patch({ op: "move", path: "/c/0" })).toBe(false);
        expect(event({ sequence: 1, timestamp: "2026-01-01T00:00:00Z", patches: [{ op: "remove", path: "/c/0" }] })).toBe(true);
    });
});
