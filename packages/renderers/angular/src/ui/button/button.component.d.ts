import { EventEmitter } from '@angular/core';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
    size?: "default" | "sm" | "lg" | "xl" | "icon" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export declare class GuipButton {
    variant: ButtonVariants['variant'];
    size: ButtonVariants['size'];
    type: 'button' | 'submit' | 'reset';
    disabled: boolean;
    loading: boolean;
    class: string;
    onClick: EventEmitter<MouseEvent>;
    protected computedClass: import("@angular/core").Signal<string>;
}
export {};
//# sourceMappingURL=button.component.d.ts.map