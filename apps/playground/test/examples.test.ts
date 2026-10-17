import { describe, expect, it } from "vitest";
import { validateDocument } from "@genui-protocol/validation";
import { EXAMPLES } from "../src/examples";

describe("playground examples", () => {
    for (const [name, doc] of Object.entries(EXAMPLES)) {
        it(`${name} is a valid document`, () => {
            expect(validateDocument(doc)).toEqual({ valid: true });
        });
    }
});
