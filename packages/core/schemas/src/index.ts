import { UINode } from "@genui-protocol/ast";

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

// ---------------------------------------------------------------------------
// Published protocol schemas (JSON Schema draft 2020-12). These are the normative
// machine-readable definitions; `pnpm --filter @genui-protocol/schemas emit`
// writes them to /spec/schemas.
// ---------------------------------------------------------------------------

const SCHEMA_BASE = "https://genui-protocol.dev/schemas/v1";

export const astNodeJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SCHEMA_BASE}/node.json`,
    title: "GenUI Node",
    type: "object",
    properties: {
        id: { type: "string", minLength: 1 },
        t: { type: "string", minLength: 1 },
        p: { type: "object" },
        c: { type: "array", items: { $ref: "#" } }
    },
    required: ["t"],
    additionalProperties: false
} as const;

export const astDocumentJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SCHEMA_BASE}/document.json`,
    title: "GenUI Document",
    type: "object",
    properties: {
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+" },
        root: { $ref: "node.json" },
        data: { type: "object" }
    },
    required: ["version", "root"],
    additionalProperties: false
} as const;

export const astPatchJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SCHEMA_BASE}/patch.json`,
    title: "GenUI Patch Operation (RFC 6902)",
    type: "object",
    properties: {
        op: { enum: ["add", "remove", "replace", "move", "copy", "test"] },
        path: { type: "string" },
        from: { type: "string" },
        value: {}
    },
    required: ["op", "path"],
    allOf: [
        { if: { properties: { op: { enum: ["move", "copy"] } } }, then: { required: ["from"] } },
        { if: { properties: { op: { enum: ["add", "replace", "test"] } } }, then: { required: ["value"] } }
    ],
    additionalProperties: false
} as const;

export const streamEventJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SCHEMA_BASE}/stream-event.json`,
    title: "GenUI Stream Event",
    type: "object",
    properties: {
        transport: { type: "string" },
        sequence: { type: "integer", minimum: 1 },
        timestamp: { type: "string", format: "date-time" },
        patches: { type: "array", items: { $ref: "patch.json" } }
    },
    required: ["sequence", "timestamp", "patches"]
} as const;

export const actionJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SCHEMA_BASE}/action.json`,
    title: "GenUI Action",
    oneOf: [
        { type: "object", properties: { do: { const: "setData" }, path: { type: "string", minLength: 1 }, value: {} }, required: ["do", "path", "value"], additionalProperties: false },
        { type: "object", properties: { do: { const: "toggle" }, path: { type: "string", minLength: 1 } }, required: ["do", "path"], additionalProperties: false },
        { type: "object", properties: { do: { const: "navigate" }, to: { type: "string", minLength: 1 } }, required: ["do", "to"], additionalProperties: false },
        { type: "object", properties: { do: { const: "emit" }, name: { type: "string", minLength: 1 }, payload: { type: "object" } }, required: ["do", "name"], additionalProperties: false },
        { type: "object", properties: { do: { const: "submit" }, name: { type: "string", minLength: 1 }, from: { type: "string", minLength: 1 } }, required: ["do", "name", "from"], additionalProperties: false }
    ]
} as const;

export const streamFrameJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SCHEMA_BASE}/stream-frame.json`,
    title: "GenUI Stream Frame",
    type: "object",
    properties: {
        type: { enum: ["snapshot", "patch", "data", "error", "ast"] },
        sequence: { type: "integer", minimum: 1 },
        document: { $ref: "document.json" },
        ast: { $ref: "document.json" },
        patches: { type: "array", items: { $ref: "patch.json" } },
        dataPatches: { type: "array", items: { $ref: "patch.json" } },
        message: { type: "string" },
        code: { type: "string" }
    },
    required: ["type"],
    allOf: [
        { if: { properties: { type: { const: "snapshot" } } }, then: { required: ["document"] } },
        { if: { properties: { type: { const: "ast" } } }, then: { required: ["ast"] } },
        { if: { properties: { type: { enum: ["patch", "data"] } } }, then: { required: ["patches"] } },
        { if: { properties: { type: { const: "error" } } }, then: { required: ["message"] } }
    ]
} as const;

export const publishedSchemas = {
    "action.json": actionJsonSchema,
    "stream-frame.json": streamFrameJsonSchema,
    "node.json": astNodeJsonSchema,
    "document.json": astDocumentJsonSchema,
    "patch.json": astPatchJsonSchema,
    "stream-event.json": streamEventJsonSchema
} as const;
