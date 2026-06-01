/**
 * @ainative-ui/components-data
 *
 * Type-safe UINode builder utilities for data-display components.
 * Covers table, chart, KPI, timeline, and execution graph.
 */
import { UINode } from "@ainative-ui/ast";

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
export type TableColumn = {
    header: string;
    accessor: string;
};

export type TableProps = {
    columns: TableColumn[];
    data: Record<string, unknown>[];
};

export const table = (props: TableProps): UINode => ({
    t: "table",
    p: props as unknown as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------
export type KpiTrend = "up" | "down" | "flat";

export type KpiProps = {
    label: string;
    value: string;
    subtext?: string;
    trend?: KpiTrend;
    trendValue?: string;
};

export const kpi = (props: KpiProps): UINode => ({
    t: "kpi",
    p: props as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
export type TimelineItemStatus = "completed" | "current" | "upcoming";

export type TimelineItem = {
    title: string;
    date: string;
    description?: string;
    icon?: string;
    status?: TimelineItemStatus;
};

export type TimelineProps = {
    items: TimelineItem[];
};

export const timeline = (props: TimelineProps): UINode => ({
    t: "timeline",
    p: props as unknown as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Execution Graph
// ---------------------------------------------------------------------------
export type GraphNodeType = "input" | "process" | "output";
export type GraphNodeStatus = "idle" | "running" | "success" | "error";

export type GraphNode = {
    id: string;
    label: string;
    type: GraphNodeType;
    status: GraphNodeStatus;
};

export type GraphEdge = {
    source: string;
    target: string;
    animated?: boolean;
};

export type ExecutionGraphProps = {
    nodes: GraphNode[];
    edges: GraphEdge[];
};

export const executionGraph = (props: ExecutionGraphProps): UINode => ({
    t: "executionGraph",
    p: props as unknown as Record<string, unknown>,
});
