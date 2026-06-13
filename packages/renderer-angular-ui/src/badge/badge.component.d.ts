import { type VariantProps } from 'class-variance-authority';
declare const badgeVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
export declare class GuipBadge {
    variant: BadgeVariants['variant'];
    class: string;
    protected computedClass: import("@angular/core").Signal<string>;
}
export {};
//# sourceMappingURL=badge.component.d.ts.map