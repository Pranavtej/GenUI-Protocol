/**
 * @ainative-ui/components-workflows
 *
 * Type-safe UINode builder utilities for workflow and dashboard components.
 * Covers workflow pipelines and dashboard layouts as defined in the component-registry.
 */
import { UINode } from "@ainative-ui/ast";

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------
export type WorkflowStepStatus = "pending" | "active" | "completed" | "failed";

export type WorkflowStep = {
    id: string;
    name: string;
    status: WorkflowStepStatus;
    duration?: string;
};

export type WorkflowProps = {
    steps: WorkflowStep[];
};

export const workflow = (props: WorkflowProps): UINode => ({
    t: "workflow",
    p: props as unknown as Record<string, unknown>,
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export type DashboardLayout = "grid" | "flex";

export type DashboardProps = {
    title: string;
    layout?: DashboardLayout;
};

export const dashboard = (props: DashboardProps, children: UINode[] = []): UINode => ({
    t: "dashboard",
    p: props as Record<string, unknown>,
    c: children,
});
