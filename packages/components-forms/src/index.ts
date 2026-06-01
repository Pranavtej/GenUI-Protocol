/**
 * @ainative-ui/components-forms
 *
 * Type-safe UINode builder utilities for form components.
 * Covers input, textarea, select, and checkbox as defined in the component-registry.
 */
import { UINode } from "@ainative-ui/ast";

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
export type InputType = "text" | "email" | "password" | "number";

export type InputProps = {
    label?: string;
    placeholder?: string;
    value?: string;
    type?: InputType;
    disabled?: boolean;
};

export const input = (props: InputProps = {}): UINode => ({
    t: "input",
    p: props as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------
export type TextareaProps = {
    label?: string;
    placeholder?: string;
    value?: string;
    rows?: number;
    disabled?: boolean;
};

export const textarea = (props: TextareaProps = {}): UINode => ({
    t: "textarea",
    p: props as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------
export type SelectOption = {
    label: string;
    value: string;
};

export type SelectProps = {
    label?: string;
    options: SelectOption[];
    value?: string;
    disabled?: boolean;
};

export const select = (props: SelectProps): UINode => ({
    t: "select",
    p: props as unknown as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------
export type CheckboxProps = {
    label: string;
    checked?: boolean;
    disabled?: boolean;
};

export const checkbox = (props: CheckboxProps): UINode => ({
    t: "checkbox",
    p: props as Record<string, unknown>,
});
