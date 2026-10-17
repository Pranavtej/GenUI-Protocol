import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateDocument } from "../src/index";

const fixtures = JSON.parse(readFileSync(join(__dirname, "../../../../conformance/validation.json"), "utf8"));

describe("conformance/validation.json", () => {
    for (const c of fixtures.cases) {
        it(c.name, () => {
            const result = validateDocument(c.document);
            expect(result.valid).toBe(c.valid);
            if (c.errorContains) expect(result.errors?.join("\n")).toContain(c.errorContains);
        });
    }
});
