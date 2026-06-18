export type UINodeProps = Record<string, unknown>;
export type UINode = {
    id?: string;
    t: string;
    p?: UINodeProps;
    c?: UINode[];
};
export type ASTDocument = {
    version: string;
    root: UINode;
};
export declare const createNode: (type: string, props?: UINodeProps, children?: UINode[] | UINode) => UINode;
export declare const defaultASTDocument: (root: UINode) => ASTDocument;
//# sourceMappingURL=index.d.ts.map