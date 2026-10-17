import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyPatches } from "../src/index";

const fixtures = JSON.parse(readFileSync(join(__dirname, "../../../../conformance/patch.json"), "utf8"));

describe("conformance/patch.json", () => {
    for (const c of fixtures.cases) {
        it(c.name, () => {
            const before = JSON.parse(JSON.stringify(c.input));
            if (c.error) {
                expect(() => applyPatches(c.input, c.patches)).toThrow();
                expect(c.input).toEqual(before);
            } else {
                expect(applyPatches(c.input, c.patches)).toEqual(c.expected);
            }
        });
    }
});
