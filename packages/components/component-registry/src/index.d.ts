import { ComponentSchema } from "@ainative-ui/schemas";
export type RegistryEntry = ComponentSchema & {
    id: string;
    category: "layout" | "general" | "data" | "forms" | "overlay" | "workflows";
    events?: string[];
};
export declare class ComponentRegistry {
    private entries;
    constructor(initialEntries?: RegistryEntry[]);
    list(): RegistryEntry[];
    get(name: string): RegistryEntry | undefined;
    search(query: string): RegistryEntry[];
    register(entry: RegistryEntry): void;
}
//# sourceMappingURL=index.d.ts.map