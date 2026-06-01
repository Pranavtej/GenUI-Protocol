import { UINode } from "@ainative-ui/ast";

export type ComponentSchema = {
    name: string;
    version: string;
    schema: Record<string, unknown>;
    examples?: UINode[];
    description?: string;
    renderers?: string[];
};

export const nodeSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        t: { type: "string" },
        p: { type: "object", additionalProperties: true },
        c: { type: "array", items: { $ref: "#/definitions/node" } }
    },
    required: ["t"],
    additionalProperties: false,
    definitions: {
        node: {
            type: "object",
            properties: {
                id: { type: "string" },
                t: { type: "string" },
                p: { type: "object", additionalProperties: true },
                c: { type: "array", items: { $ref: "#/definitions/node" } }
            },
            required: ["t"],
            additionalProperties: false
        }
    }
};

export const registrySchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        version: { type: "string" },
        description: { type: "string" },
        renderers: { type: "array", items: { type: "string" } },
        props: { type: "object", additionalProperties: true },
        events: { type: "array", items: { type: "string" } }
    },
    required: ["name", "version", "renderers"],
    additionalProperties: false
};

export const createComponentSchema = (name: string, schema: Record<string, unknown>, renderers: string[], examples: UINode[] = []) => ({
    name,
    version: "1.0.0",
    schema,
    renderers,
    examples,
});
