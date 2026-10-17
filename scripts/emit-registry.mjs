// Writes the component registry as JSON for non-TypeScript consumers (the Python SDK bundles it).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ComponentRegistry } from "../packages/components/component-registry/dist/src/index.js";

const out = join(dirname(fileURLToPath(import.meta.url)), "../packages/sdk/python/genui_protocol_sdk/registry.json");
mkdirSync(dirname(out), { recursive: true });
const entries = new ComponentRegistry().list().map(({ id, name, version, category, description, renderers, events, schema }) => ({ id, name, version, category, description, renderers, events, schema }));
writeFileSync(out, JSON.stringify(entries, null, 2) + "\n");
console.log(`Wrote ${entries.length} components to ${out}`);
