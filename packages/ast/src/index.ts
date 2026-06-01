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

export const createNode = (type: string, props?: UINodeProps, children?: UINode[] | UINode): UINode => {
    const node: UINode = { t: type };

    if (props && Object.keys(props).length > 0) {
        node.p = props;
    }

    if (children) {
        node.c = Array.isArray(children) ? children : [children];
    }

    return node;
};

export const defaultASTDocument = (root: UINode): ASTDocument => ({
    version: "1.0.0",
    root,
});
