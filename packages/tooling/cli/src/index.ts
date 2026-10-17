import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import type { ASTDocument } from "@genui-protocol/ast";
import type { ASTPatch } from "@genui-protocol/protocol";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { FEW_SHOTS, buildSystemPrompt } from "@genui-protocol/prompt-kit";
import { PatchError, applyPatches, buildRuntimeTree, diffRuntimeTree, toAST } from "@genui-protocol/runtime-core";
import { publishedSchemas } from "@genui-protocol/schemas";
import { validateDocument } from "@genui-protocol/validation";

export type IO = {
    stdout: (s: string) => void;
    stderr: (s: string) => void;
    /** Reads a file path, or stdin when the path is "-". */
    read: (path: string) => string;
};

export const nodeIO = (): IO => ({
    stdout: (s) => void process.stdout.write(s),
    stderr: (s) => void process.stderr.write(s),
    read: (path) => readFileSync(path === "-" ? 0 : path, "utf8"),
});

const HELP = `genui — work with GenUI Protocol documents

Usage: genui <command> [options]

Commands:
  validate <file|->            Validate a document (exit 1 if invalid)  [--renderer <name>] [--json]
  diff <before> <after>        RFC 6902 patches turning one document into the other
  patch <document> <patches>   Apply node patches to a document and print the result
  scaffold [name]              Print a starter document (no name: list them)
  components [name]            List components, or show one with its props schema  [--json]
  schema [name]                Print a published JSON Schema (no name: list them)
  prompt                       Print the LLM system prompt (component catalogue included)
  help                         Show this help

Files are JSON. Use "-" to read stdin.`;

class UsageError extends Error {}

const parseJson = (io: IO, path: string, what: string): unknown => {
    let raw: string;
    try {
        raw = io.read(path);
    } catch (e) {
        throw new UsageError(`Cannot read ${what} "${path}": ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        throw new UsageError(`${what} "${path}" is not valid JSON: ${(e as Error).message}`);
    }
};

const asDocument = (value: unknown, what: string): ASTDocument => {
    const v = value as Partial<ASTDocument> | null;
    if (!v || typeof v !== "object" || typeof v.version !== "string" || typeof v.root !== "object") {
        throw new UsageError(`${what} must be a document: { "version": "...", "root": { ... } }`);
    }
    return v as ASTDocument;
};

const SCAFFOLDS: Record<string, () => ASTDocument> = {
    dashboard: () => structuredClone(FEW_SHOTS[0].document),
    form: () => structuredClone(FEW_SHOTS[1].document),
    workflow: () => structuredClone(FEW_SHOTS[2].document),
    blank: () => ({ version: "1.0.0", root: { t: "page", p: { title: "New page" } } }),
};

/** Runs the CLI and returns the process exit code (0 ok, 1 negative result, 2 usage error). */
export const run = (argv: string[], io: IO = nodeIO()): number => {
    const [command, ...rest] = argv;
    const out = (s: string) => io.stdout(s + "\n");
    try {
        switch (command) {
            case undefined:
            case "help":
            case "--help":
            case "-h":
                out(HELP);
                return 0;

            case "validate": {
                const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, options: { renderer: { type: "string" }, json: { type: "boolean" } } });
                if (positionals.length !== 1) throw new UsageError("validate takes exactly one file (use - for stdin)");
                const result = validateDocument(parseJson(io, positionals[0], "document"), values.renderer);
                if (values.json) out(JSON.stringify(result, null, 2));
                else if (result.valid) out("✓ valid");
                else io.stderr(`✗ invalid (${result.errors?.length ?? 0} problem${result.errors?.length === 1 ? "" : "s"})\n${(result.errors ?? []).map((e) => `  - ${e}`).join("\n")}\n`);
                return result.valid ? 0 : 1;
            }

            case "diff": {
                if (rest.length !== 2) throw new UsageError("diff takes <before> <after>");
                const before = asDocument(parseJson(io, rest[0], "before"), "before");
                const after = asDocument(parseJson(io, rest[1], "after"), "after");
                const patches = diffRuntimeTree(buildRuntimeTree(before), buildRuntimeTree(after));
                out(JSON.stringify(patches, null, 2));
                return 0;
            }

            case "patch": {
                if (rest.length !== 2) throw new UsageError("patch takes <document> <patches>");
                const doc = asDocument(parseJson(io, rest[0], "document"), "document");
                const patches = parseJson(io, rest[1], "patches");
                if (!Array.isArray(patches)) throw new UsageError("patches must be a JSON array of RFC 6902 operations");
                try {
                    out(JSON.stringify({ ...doc, root: applyPatches(toAST(buildRuntimeTree(doc).root), patches as ASTPatch[]) }, null, 2));
                } catch (e) {
                    if (e instanceof PatchError) {
                        io.stderr(`✗ patch failed: ${e.message}\n`);
                        return 1;
                    }
                    throw e;
                }
                return 0;
            }

            case "scaffold": {
                const name = rest[0];
                if (!name) {
                    out(Object.keys(SCAFFOLDS).join("\n"));
                    return 0;
                }
                const make = SCAFFOLDS[name];
                if (!make) throw new UsageError(`Unknown scaffold "${name}". Available: ${Object.keys(SCAFFOLDS).join(", ")}`);
                out(JSON.stringify(make(), null, 2));
                return 0;
            }

            case "components": {
                const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, options: { json: { type: "boolean" } } });
                const registry = new ComponentRegistry();
                if (positionals[0]) {
                    const entry = registry.get(positionals[0]);
                    if (!entry) throw new UsageError(`Unknown component "${positionals[0]}". Try: ${registry.search(positionals[0]).map((e) => e.id).join(", ") || "genui components"}`);
                    out(JSON.stringify(entry, null, 2));
                } else if (values.json) {
                    out(JSON.stringify(registry.list(), null, 2));
                } else {
                    for (const e of registry.list()) out(`${e.id.padEnd(16)} ${e.category.padEnd(10)} ${e.description ?? ""}`);
                }
                return 0;
            }

            case "schema": {
                const name = rest[0];
                const available = Object.keys(publishedSchemas);
                if (!name) {
                    out(available.join("\n"));
                    return 0;
                }
                const key = (name.endsWith(".json") ? name : `${name}.json`) as keyof typeof publishedSchemas;
                if (!(key in publishedSchemas)) throw new UsageError(`Unknown schema "${name}". Available: ${available.join(", ")}`);
                out(JSON.stringify(publishedSchemas[key], null, 2));
                return 0;
            }

            case "prompt":
                out(buildSystemPrompt());
                return 0;

            default:
                throw new UsageError(`Unknown command "${command}". Run "genui help".`);
        }
    } catch (e) {
        if (e instanceof UsageError || (e instanceof TypeError && (e as { code?: string }).code?.startsWith("ERR_PARSE_ARGS"))) {
            io.stderr(`error: ${(e as Error).message}\n`);
            return 2;
        }
        throw e;
    }
};
