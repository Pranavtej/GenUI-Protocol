import Ajv, { ValidateFunction } from "ajv";
import { z } from "zod";
import { UINode, ASTDocument } from "@genui-protocol/ast";
import { PROTOCOL_VERSION, MAX_ACTIONS_PER_EVENT, isActionProp, isSafeUrl, toActionList, validateAction } from "@genui-protocol/protocol";
import { registrySchema, nodeSchema } from "@genui-protocol/schemas";
import { ComponentRegistry } from "@genui-protocol/component-registry";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateNodeJSON = ajv.compile(nodeSchema);
const validateRegistryJSON = ajv.compile(registrySchema);

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

export type ValidationLimits = {
    /** Maximum nesting depth (root = depth 1). */
    maxDepth: number;
    /** Maximum total number of nodes in the document. */
    maxNodes: number;
    /** Maximum length of any single string prop value. */
    maxStringLength: number;
};

export const DEFAULT_LIMITS: ValidationLimits = {
    maxDepth: 64,
    maxNodes: 5000,
    maxStringLength: 100_000
};

export type ValidatorOptions = {
    registry?: ComponentRegistry;
    limits?: Partial<ValidationLimits>;
    /** Optional allow-list of component types; anything else is rejected even if registered. */
    allowedComponents?: string[];
};

/** Prop names that carry URLs and are therefore scheme-checked. */
const URL_PROPS = new Set(["href", "src", "url", "link", "action", "poster", "srcset"]);

export { isSafeUrl };

const isExpression = (v: unknown): boolean =>
    typeof v === "object" && v !== null && !Array.isArray(v) && ("$bind" in v || "$tpl" in v);

/** Copy of a component schema with the given props removed from `properties` and `required`. */
const withoutProps = (schema: Record<string, unknown>, names: string[]): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...schema };
    if (schema["properties"] && typeof schema["properties"] === "object") {
        out["properties"] = Object.fromEntries(Object.entries(schema["properties"] as object).filter(([k]) => !names.includes(k)));
    }
    if (Array.isArray(schema["required"])) out["required"] = (schema["required"] as string[]).filter((k) => !names.includes(k));
    return out;
};

const MAJOR = (v: string) => v.split(".")[0];

export type Validator = {
    validateDocument: (doc: unknown, targetRenderer?: string) => ValidationResult;
    validateNode: (node: unknown, targetRenderer?: string) => ValidationResult;
    validateNodeProps: (node: UINode) => ValidationResult;
};

export const createValidator = (options: ValidatorOptions = {}): Validator => {
    const registry = options.registry ?? new ComponentRegistry();
    const limits: ValidationLimits = { ...DEFAULT_LIMITS, ...options.limits };
    const allowed = options.allowedComponents ? new Set(options.allowedComponents) : undefined;
    const componentAjv = new Ajv({ allErrors: true, strict: false });
    // Compiled validators are cached per schema object, so a node set is compiled once, not once per node.
    const compiled = new WeakMap<object, Map<string, ValidateFunction>>();

    const validatorFor = (schema: Record<string, unknown>, exempt: string[] = []): ValidateFunction => {
        const variantKey = [...exempt].sort().join("\u0000");
        let variants = compiled.get(schema);
        if (!variants) {
            variants = new Map();
            compiled.set(schema, variants);
        }
        let fn = variants.get(variantKey);
        if (!fn) {
            fn = componentAjv.compile(exempt.length > 0 ? withoutProps(schema, exempt) : schema);
            variants.set(variantKey, fn);
        }
        return fn;
    };

    const validateNodeProps = (node: UINode): ValidationResult => {
        const entry = registry.get(node.t);
        if (!entry) {
            return { valid: false, errors: [`Unknown component type: "${node.t}"`] };
        }
        // Props holding actions or $bind/$tpl expressions are validated separately (checkProps); the component
        // schema describes the *resolved* value, so those props are exempt from the type check (and count as present).
        const schemaProps: Record<string, unknown> = {};
        const exempt: string[] = [];
        for (const [k, v] of Object.entries(node.p || {})) {
            if (isActionProp(k) || isExpression(v)) exempt.push(k);
            else schemaProps[k] = v;
        }
        const validate = validatorFor(entry.schema, exempt);
        if (!validate(schemaProps)) {
            const errors = validate.errors?.map((err) => `Props validation error for component "${node.t}": ${err.instancePath} ${err.message}`) || [];
            return { valid: false, errors };
        }
        return { valid: true };
    };

    /** Iterative walk (safe against hostile depth) enforcing size limits before any recursive validation. */
    const checkLimits = (root: unknown): string[] => {
        const errors: string[] = [];
        let count = 0;
        const stack: Array<{ node: unknown; depth: number }> = [{ node: root, depth: 1 }];
        while (stack.length > 0) {
            const { node, depth } = stack.pop()!;
            if (typeof node !== "object" || node === null) continue;
            count++;
            if (count > limits.maxNodes) return [`Document exceeds maximum of ${limits.maxNodes} nodes`];
            if (depth > limits.maxDepth) return [`Document exceeds maximum depth of ${limits.maxDepth}`];
            const c = (node as { c?: unknown }).c;
            if (Array.isArray(c)) for (const child of c) stack.push({ node: child, depth: depth + 1 });
        }
        return errors;
    };

    const checkProps = (node: UINode, path: string, errors: string[]) => {
        if (!node.p) return;
        for (const [key, value] of Object.entries(node.p)) {
            if (isActionProp(key)) {
                const actions = toActionList(value);
                if (actions.length > MAX_ACTIONS_PER_EVENT) errors.push(`Path "${path}": prop "${key}" has more than ${MAX_ACTIONS_PER_EVENT} actions`);
                actions.slice(0, MAX_ACTIONS_PER_EVENT).forEach((a, i) => {
                    validateAction(a).forEach((e) => errors.push(`Path "${path}": prop "${key}"[${i}]: ${e}`));
                });
                continue;
            }
            if (isExpression(value)) {
                const v = value as Record<string, unknown>;
                const validBind = typeof v["$bind"] === "string" && v["$bind"].length > 0 && Object.keys(v).every((k) => k === "$bind" || k === "default");
                const validTpl = typeof v["$tpl"] === "string" && Object.keys(v).length === 1;
                if (!validBind && !validTpl) errors.push(`Path "${path}": prop "${key}" is a malformed $bind/$tpl expression`);
                else if (validTpl && (v["$tpl"] as string).length > limits.maxStringLength) errors.push(`Path "${path}": prop "${key}" template exceeds maximum string length`);
                continue;
            }
            if (typeof value !== "string") continue;
            if (value.length > limits.maxStringLength) {
                errors.push(`Path "${path}": prop "${key}" exceeds maximum string length of ${limits.maxStringLength}`);
            } else if (URL_PROPS.has(key.toLowerCase()) && !isSafeUrl(value)) {
                errors.push(`Path "${path}": prop "${key}" uses a disallowed URL scheme`);
            }
        }
    };

    const validateNode = (root: unknown, targetRenderer?: string): ValidationResult => {
        if (typeof root !== "object" || root === null) {
            return { valid: false, errors: ["Node must be an object"] };
        }

        // A. Limits first: everything below recurses.
        const limitErrors = checkLimits(root);
        if (limitErrors.length > 0) return { valid: false, errors: limitErrors };

        // B. Structure using Zod
        const zodResult = UINodeZodSchema.safeParse(root);
        if (!zodResult.success) {
            return { valid: false, errors: zodResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`) };
        }

        // C. JSON schema of the tree structure via Ajv
        if (!validateNodeJSON(root)) {
            return { valid: false, errors: validateNodeJSON.errors?.map((err) => `${err.instancePath}: ${err.message}`) || [] };
        }

        const errors: string[] = [];
        const seenIds = new Set<string>();

        // D. Deep traverse: props, allow-list, renderer support, id uniqueness
        const traverse = (node: UINode, path: string) => {
            if (node.id !== undefined) {
                if (seenIds.has(node.id)) errors.push(`Path "${path}": duplicate node id "${node.id}"`);
                seenIds.add(node.id);
            }

            if (allowed && !allowed.has(node.t)) {
                errors.push(`Path "${path}": Component "${node.t}" is not allowed`);
            }

            const propsVal = validateNodeProps(node);
            if (!propsVal.valid && propsVal.errors) {
                errors.push(...propsVal.errors.map((e) => `Path "${path}": ${e}`));
            }
            checkProps(node, path, errors);

            if (targetRenderer) {
                const entry = registry.get(node.t);
                if (entry && entry.renderers && !entry.renderers.includes(targetRenderer)) {
                    errors.push(`Path "${path}": Component "${node.t}" is not supported by renderer "${targetRenderer}"`);
                }
            }

            node.c?.forEach((child, index) => traverse(child, `${path}/c/${index}`));
        };

        traverse(root as UINode, "/root");

        return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
    };

    const validateDocument = (doc: unknown, targetRenderer?: string): ValidationResult => {
        if (typeof doc !== "object" || doc === null || typeof (doc as ASTDocument).version !== "string" || !("root" in doc)) {
            return { valid: false, errors: ['Document must be an object with "version" (string) and "root" (node)'] };
        }
        const { version, root, data } = doc as ASTDocument;
        if (data !== undefined && (typeof data !== "object" || data === null || Array.isArray(data))) {
            return { valid: false, errors: ['"data" must be an object'] };
        }
        if (!/^\d+\.\d+\.\d+/.test(version)) {
            return { valid: false, errors: [`Invalid version "${version}": expected semver`] };
        }
        if (MAJOR(version) !== MAJOR(PROTOCOL_VERSION)) {
            return { valid: false, errors: [`Unsupported protocol version "${version}": this validator supports ${MAJOR(PROTOCOL_VERSION)}.x`] };
        }
        return validateNode(root, targetRenderer);
    };

    return { validateDocument, validateNode, validateNodeProps };
};

const defaultValidator = createValidator();

/** Validates a full `{ version, root }` document. */
export const validateDocument = defaultValidator.validateDocument;

/** Validates a single node tree (no version envelope). */
export const validateNode = defaultValidator.validateNode;

export const validateNodeProps = defaultValidator.validateNodeProps;

/** @deprecated Despite the name this validates a root node. Use `validateNode` or `validateDocument`. */
export const validateASTDocument = (root: UINode, targetRenderer?: string): ValidationResult => defaultValidator.validateNode(root, targetRenderer);

/** @deprecated Use `validateNode`. */
export const validateASTNode = (node: UINode): ValidationResult => defaultValidator.validateNode(node);

export const validateComponentSchema = (schema: unknown): ValidationResult => {
    const valid = validateRegistryJSON(schema);
    return {
        valid: valid as boolean,
        errors: validateRegistryJSON.errors?.map((e) => `${e.instancePath}: ${e.message}`) ?? undefined
    };
};
