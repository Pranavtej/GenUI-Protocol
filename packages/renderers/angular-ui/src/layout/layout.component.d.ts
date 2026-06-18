/**
 * GuipFlex: Headless flexbox layout component
 * Behavior: Flex container with configurable direction/alignment
 * Styling: CSS custom properties and inline styles
 */
export declare class GuipFlex {
    gap: string;
    justifyContent: string;
    alignItems: string;
    wrap: boolean;
}
/**
 * GuipStack: Headless vertical stack (flex column)
 * Behavior: Vertical flex container
 * Styling: CSS custom properties
 */
export declare class GuipStack {
    gap: string;
}
/**
 * GuipGrid: Headless grid layout component
 * Behavior: CSS Grid container
 * Styling: Configurable columns
 */
export declare class GuipGrid {
    columns: number;
    gap: string;
    get templateColumns(): string;
}
//# sourceMappingURL=layout.component.d.ts.map