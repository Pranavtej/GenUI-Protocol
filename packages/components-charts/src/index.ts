/**
 * @ainative-ui/components-charts
 *
 * Type-safe UINode builder utilities for chart components.
 * All chart variants (line, bar, pie) use the same component type
 * with a `type` prop as defined in the component-registry schema.
 */
import { UINode } from "@ainative-ui/ast";

// ---------------------------------------------------------------------------
// Chart Types
// ---------------------------------------------------------------------------
export type ChartType = "line" | "bar" | "pie";
export type ChartColorScheme = "default" | "emerald" | "rose" | "amber";

export type ChartDataPoint = {
    label: string;
    value: number;
};

export type ChartProps = {
    type: ChartType;
    data: ChartDataPoint[];
    height?: number;
    colorScheme?: ChartColorScheme;
};

// ---------------------------------------------------------------------------
// Chart Builder
// ---------------------------------------------------------------------------
export const chart = (props: ChartProps): UINode => ({
    t: "chart",
    p: props as unknown as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Convenience Builders
// ---------------------------------------------------------------------------
export const lineChart = (
    data: ChartDataPoint[],
    colorScheme: ChartColorScheme = "default",
    height?: number
): UINode =>
    chart({ type: "line", data, colorScheme, height });

export const barChart = (
    data: ChartDataPoint[],
    colorScheme: ChartColorScheme = "default",
    height?: number
): UINode =>
    chart({ type: "bar", data, colorScheme, height });

export const pieChart = (
    data: ChartDataPoint[],
    colorScheme: ChartColorScheme = "default",
    height?: number
): UINode =>
    chart({ type: "pie", data, colorScheme, height });
