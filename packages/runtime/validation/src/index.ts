import Ajv, { ValidateFunction } from "ajv";
import { z } from "zod";
import { UINode, ASTDocument } from "@genui-protocol/ast";
import { PROTOCOL_VERSION } from "@genui-protocol/protocol";
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
const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Returns true when `value` is a relative reference or uses an allowed scheme (no javascript:, data:, vbscript:, ...). */
export const isSafeUrl = (value: string): boolean => {
    // Browsers ignore whitespace/control characters inside a scheme ("java\tscript:"), so strip them first.
    // eslint-disable-next-line no-control-regex
    const cleaned = value.replace(/[\u0000- \u007f-\u009f]/g, "");
    const match = /^([a-zA-Z][a-zA-Z0-9+.-]*:)/.exec(cleaned);
    if (!match) return true; // relative URL, fragment, query
    return SAFE_URL_SCHEMES.has(match[1].toLowerCase());
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
    const compiled = new WeakMap<object, ValidateFunction>();

    const validatorFor = (schema: Record<string, unknown>): ValidateFunction => {
        let fn = compiled.get(schema);
        if (!fn) {
            fn = componentAjv.compile(schema);
            compiled.set(schema, fn);
        }
        return fn;
    };

    const validateNodeProps = (node: UINode): ValidationResult => {
        const entry = registry.get(node.t);
        if (!entry) {
            return { valid: false, errors: [`Unknown component type: "${node.t}"`] };
        }
        const validate = validatorFor(entry.schema);
        if (!validate(node.p || {})) {
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
        const { version, root } = doc as ASTDocument;
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
