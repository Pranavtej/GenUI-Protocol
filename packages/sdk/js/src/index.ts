import { ASTDocument, createNode, defaultASTDocument } from "@genui-protocol/ast";
import { validateNode } from "@genui-protocol/validation";

export * from "./builders.js";
export * from "./client.js";

export type { ASTDocument, UINode } from "@genui-protocol/ast";
export type { Action, ASTPatch, StreamFrame } from "@genui-protocol/protocol";
export { PROTOCOL_VERSION } from "@genui-protocol/protocol";
export { validateDocument, validateNode, createValidator, isSafeUrl } from "@genui-protocol/validation";
export type { ValidationResult, ValidatorOptions } from "@genui-protocol/validation";
export {
    buildRuntimeTree, diffRuntimeTree, applyPatches, applyTreePatches, createSession, RuntimeSession, PatchError, toAST, DataStore,
} from "@genui-protocol/runtime-core";
export type { AgentEvent } from "@genui-protocol/runtime-core";
export { StreamConsumer, SSEParser, parseFrame } from "@genui-protocol/stream-engine";

import { validateDocument, type ValidationResult } from "@genui-protocol/validation";

export class InvalidDocumentError extends Error {
    constructor(public readonly errors: string[]) {
        super(`Invalid GenUI document:\n- ${errors.join("\n- ")}`);
        this.name = "InvalidDocumentError";
    }
}

/** Returns the document if valid; throws `InvalidDocumentError` listing every problem otherwise. */
export const assertValid = (document: unknown, renderer?: string): ASTDocument => {
    const result: ValidationResult = validateDocument(document, renderer);
    if (!result.valid) throw new InvalidDocumentError(result.errors ?? ["unknown error"]);
    return document as ASTDocument;
};

export type SDKOptions = { renderer?: string };

/** @deprecated Use `document(ui.dashboard(...))` from the builders. */
export const buildDashboardAST = (title: string, metric: string, value: string): ASTDocument =>
    defaultASTDocument(createNode("dashboard", { title }, [createNode("kpi", { label: metric || title, value })]));

/** @deprecated Use `validateDocument`. Validates only the root node. */
export const validateAST = (doc: ASTDocument) => validateNode(doc.root);

export const renderPayload = (doc: ASTDocument, options: SDKOptions = {}) => ({
    type: "ui.render",
    renderer: options.renderer ?? "react",
    document: doc,
});
