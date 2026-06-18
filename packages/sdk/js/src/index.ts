import { ASTDocument, createNode, defaultASTDocument, UINode } from "@ainative-ui/ast";
import { validateASTDocument } from "@ainative-ui/validation";

export type SDKOptions = {
    renderer?: string;
};

export const buildDashboardAST = (title: string, metric: string, value: string): ASTDocument => {
    return defaultASTDocument(
        createNode("dashboard", {}, [
            createNode("kpi", { label: title, value })
        ])
    );
};

export const validateAST = (document: ASTDocument) => validateASTDocument(document.root);

export const renderPayload = (document: ASTDocument, options: SDKOptions = {}) => ({
    type: "ui.render",
    renderer: options.renderer ?? "react",
    document
});
