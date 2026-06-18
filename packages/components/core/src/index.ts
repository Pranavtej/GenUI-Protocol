/**
 * @ainative-ui/components-core
 *
 * Type-safe UINode builder utilities for core protocol components.
 * Every builder returns a valid UINode aligned with the component-registry schemas.
 */
import { UINode } from "@ainative-ui/ast";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export type PageProps = {
    title: string;
    subtitle?: string;
};

export const page = (props: PageProps, children: UINode[] = []): UINode => ({
    t: "page",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
export type SectionProps = {
    title?: string;
    description?: string;
    border?: boolean;
};

export const section = (props: SectionProps = {}, children: UINode[] = []): UINode => ({
    t: "section",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export type CardProps = {
    title?: string;
    subtitle?: string;
    bordered?: boolean;
};

export const card = (props: CardProps = {}, children: UINode[] = []): UINode => ({
    t: "card",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------
export type TextSize = "xs" | "sm" | "base" | "lg" | "xl";
export type TextColor = "default" | "muted" | "primary" | "success" | "warning" | "danger";

export type TextProps = {
    content: string;
    size?: TextSize;
    color?: TextColor;
    bold?: boolean;
};

export const text = (props: TextProps): UINode => ({
    t: "text",
    p: props as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Heading
// ---------------------------------------------------------------------------
export type HeadingProps = {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
};

export const heading = (props: HeadingProps): UINode => ({
    t: "heading",
    p: props as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
export type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "default" | "lg";

export type ButtonProps = {
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
};

export const button = (props: ButtonProps): UINode => ({
    t: "button",
    p: props as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Layout — Grid
// ---------------------------------------------------------------------------
export type GridProps = {
    cols?: number;
    gap?: number;
};

export const grid = (props: GridProps = {}, children: UINode[] = []): UINode => ({
    t: "grid",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Layout — Flex
// ---------------------------------------------------------------------------
export type FlexDirection = "row" | "col";
export type FlexAlign = "start" | "center" | "end" | "stretch";
export type FlexJustify = "start" | "center" | "between" | "end";

export type FlexProps = {
    direction?: FlexDirection;
    align?: FlexAlign;
    justify?: FlexJustify;
    gap?: number;
};

export const flex = (props: FlexProps = {}, children: UINode[] = []): UINode => ({
    t: "flex",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Layout — Stack
// ---------------------------------------------------------------------------
export type StackDirection = "vertical" | "horizontal";

export type StackProps = {
    direction?: StackDirection;
    gap?: number;
};

export const stack = (props: StackProps = {}, children: UINode[] = []): UINode => ({
    t: "stack",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
export type TabItem = {
    label: string;
    value: string;
};

export type TabsProps = {
    items: TabItem[];
    activeTab?: string;
};

export const tabs = (props: TabsProps, children: UINode[] = []): UINode => ({
    t: "tabs",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------
export type DialogProps = {
    title: string;
    open?: boolean;
    description?: string;
};

export const dialog = (props: DialogProps, children: UINode[] = []): UINode => ({
    t: "dialog",
    p: props as Record<string, unknown>,
    c: children,
});

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------
export type DrawerPosition = "left" | "right";

export type DrawerProps = {
    title: string;
    open?: boolean;
    position?: DrawerPosition;
};

export const drawer = (props: DrawerProps, children: UINode[] = []): UINode => ({
    t: "drawer",
    p: props as Record<string, unknown>,
    c: children,
});
