export const createNode = (type, props, children) => {
    const node = { t: type };
    if (props && Object.keys(props).length > 0) {
        node.p = props;
    }
    if (children) {
        node.c = Array.isArray(children) ? children : [children];
    }
    return node;
};
export const defaultASTDocument = (root) => ({
    version: "1.0.0",
    root,
});
//# sourceMappingURL=index.js.map