export declare const PROTOCOL_VERSION = "1.0.0";
export type RendererKey = "react" | "angular" | "vue" | "svelte" | "react-native" | "swiftui" | "flutter";
export type ComponentSupport = {
    name: string;
    version: string;
    renderers: RendererKey[];
};
export type ASTPatch = {
    op: "add" | "remove" | "replace" | "move" | "copy" | "test";
    path: string;
    value?: unknown;
    from?: string;
};
//# sourceMappingURL=index.d.ts.map