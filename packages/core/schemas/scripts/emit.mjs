import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publishedSchemas } from "../dist/src/index.js";

const out = join(dirname(fileURLToPath(import.meta.url)), "../../../../spec/schemas");
mkdirSync(out, { recursive: true });
for (const [file, schema] of Object.entries(publishedSchemas)) {
    writeFileSync(join(out, file), JSON.stringify(schema, null, 2) + "\n");
}
console.log(`Wrote ${Object.keys(publishedSchemas).length} schemas to ${out}`);
