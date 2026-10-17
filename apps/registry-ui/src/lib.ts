import type { RegistryEntry } from "@genui-protocol/component-registry";

export type PropRow = { name: string; type: string; required: boolean; description?: string };

type JsonSchema = { type?: string; enum?: unknown[]; items?: JsonSchema; description?: string; properties?: Record<string, JsonSchema>; required?: string[] };

const typeLabel = (s: JsonSchema): string => {
    if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
    if (s.type === "array") return `${s.items ? typeLabel(s.items) : "any"}[]`;
    return s.type ?? "any";
};

/** Flattens a component's props schema into table rows. Every component also accepts `$bind`/`$tpl` for any prop. */
export const propRows = (schema: unknown): PropRow[] => {
    const s = (schema ?? {}) as JsonSchema;
    const required = new Set(s.required ?? []);
    return Object.entries(s.properties ?? {}).map(([name, def]) => ({ name, type: typeLabel(def), required: required.has(name), description: def.description }));
};

export const categories = (entries: RegistryEntry[]): string[] => [...new Set(entries.map((e) => e.category))].sort();

export const filterEntries = (entries: RegistryEntry[], query: string, category: string | null): RegistryEntry[] => {
    const q = query.trim().toLowerCase();
    return entries.filter(
        (e) => (!category || e.category === category) && (!q || e.id.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q))
    );
};
