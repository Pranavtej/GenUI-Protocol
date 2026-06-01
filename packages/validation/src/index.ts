import Ajv from "ajv";
import { z } from "zod";
import { UINode, ASTDocument } from "@ainative-ui/ast";
import { registrySchema, nodeSchema } from "@ainative-ui/schemas";
import { ComponentRegistry } from "@ainative-ui/component-registry";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateNodeJSON = ajv.compile(nodeSchema);
const validateRegistryJSON = ajv.compile(registrySchema);

const registry = new ComponentRegistry();

// 1. Zod AST Structural Validation
// Recursive definition for UINode
export const UINodeZodSchema: z.ZodType<UINode> = z.lazy(() =>
    z.object({
        id: z.string().optional(),
        t: z.string({
            required_error: "Component type 't' is required"
        }),
        p: z.record(z.unknown()).optional(),
        c: z.array(UINodeZodSchema).optional()
    })
);

export const ASTDocumentZodSchema = z.object({
    version: z.string(),
    root: UINodeZodSchema
});

export type ValidationResult = {
    valid: boolean;
    errors?: string[];
};

// 2. Props validation using registry schemas
export const validateNodeProps = (node: UINode): ValidationResult => {
    const entry = registry.get(node.t);
    if (!entry) {
        return {
            valid: false,
            errors: [`Unknown component type: "${node.t}"`]
        };
    }

    const componentAjv = new Ajv({ allErrors: true, strict: false });
    const validate = componentAjv.compile(entry.schema);
    const valid = validate(node.p || {});

    if (!valid) {
        const errors = validate.errors?.map((err) => `Props validation error for component "${node.t}": ${err.instancePath} ${err.message}`) || [];
        return { valid: false, errors };
    }

    return { valid: true };
};

// 3. Complete AST tree validation (Structure + Props + compatibility checks)
export const validateASTDocument = (root: UINode, targetRenderer?: string): ValidationResult => {
    // A. Validate structure using Zod
    const zodResult = UINodeZodSchema.safeParse(root);
    if (!zodResult.success) {
        const errors = zodResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
        return { valid: false, errors };
    }

    // B. Validate JSON schema of the tree structure via Ajv
    const ajvValid = validateNodeJSON(root);
    if (!ajvValid) {
        const errors = validateNodeJSON.errors?.map((err) => `${err.instancePath}: ${err.message}`) || [];
        return { valid: false, errors };
    }

    const errors: string[] = [];

    // C. Deep traverse and validate props + renderer support
    const traverse = (node: UINode, path: string) => {
        // Validate props
        const propsVal = validateNodeProps(node);
        if (!propsVal.valid && propsVal.errors) {
            errors.push(...propsVal.errors.map((e) => `Path "${path}": ${e}`));
        }

        // Validate renderer compatibility
        if (targetRenderer) {
            const entry = registry.get(node.t);
            if (entry && entry.renderers && !entry.renderers.includes(targetRenderer as any)) {
                errors.push(`Path "${path}": Component "${node.t}" is not supported by renderer "${targetRenderer}"`);
            }
        }

        if (node.c) {
            node.c.forEach((child, index) => {
                traverse(child, `${path}/c/${index}`);
            });
        }
    };

    traverse(root, "/root");

    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
};

export const validateASTNode = (node: UINode): ValidationResult => {
    return validateASTDocument(node);
};

export const validateComponentSchema = (schema: unknown): ValidationResult => {
    const valid = validateRegistryJSON(schema);
    return {
        valid: valid as boolean,
        errors: validateRegistryJSON.errors?.map((e) => `${e.instancePath}: ${e.message}`) ?? undefined
    };
};

