const defaultComponents = [
    {
        id: "page",
        name: "page",
        version: "1.0.0",
        description: "Root or page-level container component.",
        category: "layout",
        renderers: ["react", "angular", "vue", "svelte", "react-native", "swiftui", "flutter"],
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                subtitle: { type: "string" }
            },
            required: ["title"]
        },
        examples: [
            {
                t: "page",
                p: { title: "Overview Dashboard", subtitle: "Real-time activity logs" },
                c: []
            }
        ]
    },
    {
        id: "section",
        name: "section",
        version: "1.0.0",
        description: "Group related contents with optional title and borders.",
        category: "layout",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                border: { type: "boolean" }
            }
        },
        examples: [
            {
                t: "section",
                p: { title: "Analytical Summary", border: true },
                c: []
            }
        ]
    },
    {
        id: "card",
        name: "card",
        version: "1.0.0",
        description: "Standard card component for containing structured information.",
        category: "general",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                subtitle: { type: "string" },
                bordered: { type: "boolean" }
            }
        },
        examples: [
            {
                t: "card",
                p: { title: "Total Users", subtitle: "Active monthly visitors", bordered: true }
            }
        ]
    },
    {
        id: "text",
        name: "text",
        version: "1.0.0",
        description: "Simple inline or block paragraph text with custom size and variance.",
        category: "general",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                content: { type: "string" },
                size: { type: "string", enum: ["xs", "sm", "base", "lg", "xl"] },
                color: { type: "string", enum: ["default", "muted", "primary", "success", "warning", "danger"] },
                bold: { type: "boolean" }
            },
            required: ["content"]
        },
        examples: [
            {
                t: "text",
                p: { content: "This is a premium typography component.", size: "base", color: "muted" }
            }
        ]
    },
    {
        id: "heading",
        name: "heading",
        version: "1.0.0",
        description: "Semantic headings from H1 to H6.",
        category: "general",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                text: { type: "string" },
                level: { type: "integer", minimum: 1, maximum: 6 }
            },
            required: ["text"]
        },
        examples: [
            {
                t: "heading",
                p: { text: "Main Section Title", level: 2 }
            }
        ]
    },
    {
        id: "button",
        name: "button",
        version: "1.0.0",
        description: "Interactive button control triggering events.",
        category: "general",
        events: ["click"],
        renderers: ["react", "angular", "vue", "svelte", "react-native", "swiftui", "flutter"],
        schema: {
            type: "object",
            properties: {
                label: { type: "string" },
                variant: { type: "string", enum: ["default", "outline", "secondary", "ghost", "destructive"] },
                size: { type: "string", enum: ["sm", "default", "lg"] },
                disabled: { type: "boolean" }
            },
            required: ["label"]
        },
        examples: [
            {
                t: "button",
                p: { label: "Submit Request", variant: "default" }
            }
        ]
    },
    {
        id: "input",
        name: "input",
        version: "1.0.0",
        description: "Text, email, or number input form control.",
        category: "forms",
        events: ["change", "input"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                label: { type: "string" },
                placeholder: { type: "string" },
                value: { type: "string" },
                type: { type: "string", enum: ["text", "email", "password", "number"] },
                disabled: { type: "boolean" }
            }
        },
        examples: [
            {
                t: "input",
                p: { label: "Email Address", placeholder: "you@example.com", type: "email" }
            }
        ]
    },
    {
        id: "textarea",
        name: "textarea",
        version: "1.0.0",
        description: "Multi-line text input field.",
        category: "forms",
        events: ["change"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                label: { type: "string" },
                placeholder: { type: "string" },
                value: { type: "string" },
                rows: { type: "integer" },
                disabled: { type: "boolean" }
            }
        },
        examples: [
            {
                t: "textarea",
                p: { label: "Project Description", placeholder: "Type details here...", rows: 4 }
            }
        ]
    },
    {
        id: "select",
        name: "select",
        version: "1.0.0",
        description: "Dropdown option selector.",
        category: "forms",
        events: ["change"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                label: { type: "string" },
                options: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                            value: { type: "string" }
                        },
                        required: ["label", "value"]
                    }
                },
                value: { type: "string" },
                disabled: { type: "boolean" }
            },
            required: ["options"]
        },
        examples: [
            {
                t: "select",
                p: {
                    label: "Choose Region",
                    options: [
                        { label: "US East", value: "us-east" },
                        { label: "EU West", value: "eu-west" }
                    ]
                }
            }
        ]
    },
    {
        id: "checkbox",
        name: "checkbox",
        version: "1.0.0",
        description: "Binary selection checkbox.",
        category: "forms",
        events: ["change"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                label: { type: "string" },
                checked: { type: "boolean" },
                disabled: { type: "boolean" }
            },
            required: ["label"]
        },
        examples: [
            {
                t: "checkbox",
                p: { label: "I accept the terms and conditions", checked: false }
            }
        ]
    },
    {
        id: "table",
        name: "table",
        version: "1.0.0",
        description: "Renders tabular data with column mapping.",
        category: "data",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                columns: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            header: { type: "string" },
                            accessor: { type: "string" }
                        },
                        required: ["header", "accessor"]
                    }
                },
                data: {
                    type: "array",
                    items: { type: "object", additionalProperties: true }
                }
            },
            required: ["columns", "data"]
        },
        examples: [
            {
                t: "table",
                p: {
                    columns: [
                        { header: "Name", accessor: "name" },
                        { header: "Status", accessor: "status" }
                    ],
                    data: [
                        { name: "Server A", status: "Online" },
                        { name: "Server B", status: "Offline" }
                    ]
                }
            }
        ]
    },
    {
        id: "chart",
        name: "chart",
        version: "1.0.0",
        description: "Visualizes datasets in line, bar, or pie configurations.",
        category: "data",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["line", "bar", "pie"] },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                            value: { type: "number" }
                        },
                        required: ["label", "value"]
                    }
                },
                height: { type: "integer" },
                colorScheme: { type: "string", enum: ["default", "emerald", "rose", "amber"] }
            },
            required: ["type", "data"]
        },
        examples: [
            {
                t: "chart",
                p: {
                    type: "bar",
                    data: [
                        { label: "Q1", value: 100 },
                        { label: "Q2", value: 180 },
                        { label: "Q3", value: 150 }
                    ],
                    colorScheme: "emerald"
                }
            }
        ]
    },
    {
        id: "tabs",
        name: "tabs",
        version: "1.0.0",
        description: "Tabbed container component.",
        category: "general",
        events: ["tabChange"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                            value: { type: "string" }
                        },
                        required: ["label", "value"]
                    }
                },
                activeTab: { type: "string" }
            },
            required: ["items"]
        },
        examples: [
            {
                t: "tabs",
                p: {
                    items: [
                        { label: "Analytics", value: "analytics" },
                        { label: "Settings", value: "settings" }
                    ],
                    activeTab: "analytics"
                }
            }
        ]
    },
    {
        id: "dialog",
        name: "dialog",
        version: "1.0.0",
        description: "Interactive modal dialog popup.",
        category: "overlay",
        events: ["close"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                open: { type: "boolean" },
                description: { type: "string" }
            },
            required: ["title"]
        },
        examples: [
            {
                t: "dialog",
                p: { title: "Confirm Execution", open: false, description: "Are you sure you want to proceed?" }
            }
        ]
    },
    {
        id: "drawer",
        name: "drawer",
        version: "1.0.0",
        description: "Side drawer overlay coming from the edge.",
        category: "overlay",
        events: ["close"],
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                open: { type: "boolean" },
                position: { type: "string", enum: ["left", "right"] }
            },
            required: ["title"]
        },
        examples: [
            {
                t: "drawer",
                p: { title: "Inspect Details", open: false, position: "right" }
            }
        ]
    },
    {
        id: "grid",
        name: "grid",
        version: "1.0.0",
        description: "CSS Grid container.",
        category: "layout",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                cols: { type: "integer", minimum: 1, maximum: 12 },
                gap: { type: "integer" }
            }
        },
        examples: [
            {
                t: "grid",
                p: { cols: 3, gap: 4 }
            }
        ]
    },
    {
        id: "flex",
        name: "flex",
        version: "1.0.0",
        description: "CSS Flexbox container.",
        category: "layout",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                direction: { type: "string", enum: ["row", "col"] },
                align: { type: "string", enum: ["start", "center", "end", "stretch"] },
                justify: { type: "string", enum: ["start", "center", "between", "end"] },
                gap: { type: "integer" }
            }
        },
        examples: [
            {
                t: "flex",
                p: { direction: "row", align: "center", justify: "between", gap: 4 }
            }
        ]
    },
    {
        id: "stack",
        name: "stack",
        version: "1.0.0",
        description: "Simple horizontal or vertical layout stack.",
        category: "layout",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                direction: { type: "string", enum: ["vertical", "horizontal"] },
                gap: { type: "integer" }
            }
        },
        examples: [
            {
                t: "stack",
                p: { direction: "vertical", gap: 2 }
            }
        ]
    },
    {
        id: "kpi",
        name: "kpi",
        version: "1.0.0",
        description: "Displays a KPI value with label, trend indicators, and subtext.",
        category: "data",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                label: { type: "string" },
                value: { type: "string" },
                subtext: { type: "string" },
                trend: { type: "string", enum: ["up", "down", "flat"] },
                trendValue: { type: "string" }
            },
            required: ["label", "value"]
        },
        examples: [
            {
                t: "kpi",
                p: { label: "Revenue", value: "$124,500", subtext: "vs last month", trend: "up", trendValue: "+12%" }
            }
        ]
    },
    {
        id: "dashboard",
        name: "dashboard",
        version: "1.0.0",
        description: "Dashboard layout view containing sections and KPI widgets.",
        category: "layout",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                layout: { type: "string", enum: ["grid", "flex"] }
            },
            required: ["title"]
        },
        examples: [
            {
                t: "dashboard",
                p: { title: "Operations Hub", layout: "grid" }
            }
        ]
    },
    {
        id: "workflow",
        name: "workflow",
        version: "1.0.0",
        description: "Visualization of progress steps in an operational workflow.",
        category: "workflows",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                steps: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            status: { type: "string", enum: ["pending", "active", "completed", "failed"] },
                            duration: { type: "string" }
                        },
                        required: ["id", "name", "status"]
                    }
                }
            },
            required: ["steps"]
        },
        examples: [
            {
                t: "workflow",
                p: {
                    steps: [
                        { id: "s1", name: "Data Fetch", status: "completed", duration: "1.2s" },
                        { id: "s2", name: "Transform", status: "active" },
                        { id: "s3", name: "Ingestion", status: "pending" }
                    ]
                }
            }
        ]
    },
    {
        id: "timeline",
        name: "timeline",
        version: "1.0.0",
        description: "Chronological log event timeline.",
        category: "data",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            date: { type: "string" },
                            description: { type: "string" },
                            icon: { type: "string" },
                            status: { type: "string", enum: ["completed", "current", "upcoming"] }
                        },
                        required: ["title", "date"]
                    }
                }
            },
            required: ["items"]
        },
        examples: [
            {
                t: "timeline",
                p: {
                    items: [
                        { title: "Agent Initiated", date: "10:00 AM", description: "System spawned python agent thread.", status: "completed" },
                        { title: "Tool Invoked", date: "10:02 AM", description: "Called mcp.discover_components.", status: "completed" }
                    ]
                }
            }
        ]
    },
    {
        id: "executionGraph",
        name: "executionGraph",
        version: "1.0.0",
        description: "Graph visualization of nodes and visual edges (for AI flow execution tracing).",
        category: "workflows",
        renderers: ["react", "angular", "vue", "svelte"],
        schema: {
            type: "object",
            properties: {
                nodes: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            label: { type: "string" },
                            type: { type: "string", enum: ["input", "process", "output"] },
                            status: { type: "string", enum: ["idle", "running", "success", "error"] }
                        },
                        required: ["id", "label", "type", "status"]
                    }
                },
                edges: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            source: { type: "string" },
                            target: { type: "string" },
                            animated: { type: "boolean" }
                        },
                        required: ["source", "target"]
                    }
                }
            },
            required: ["nodes", "edges"]
        },
        examples: [
            {
                t: "executionGraph",
                p: {
                    nodes: [
                        { id: "n1", label: "Input Query", type: "input", status: "success" },
                        { id: "n2", label: "Agent Reasoning", type: "process", status: "running" },
                        { id: "n3", label: "Rendered UI", type: "output", status: "idle" }
                    ],
                    edges: [
                        { source: "n1", target: "n2", animated: true },
                        { source: "n2", target: "n3", animated: false }
                    ]
                }
            }
        ]
    }
];
export class ComponentRegistry {
    entries;
    constructor(initialEntries = defaultComponents) {
        this.entries = new Map(initialEntries.map((entry) => [entry.id, entry]));
    }
    list() {
        return Array.from(this.entries.values());
    }
    get(name) {
        return this.entries.get(name);
    }
    search(query) {
        const normalized = query.toLowerCase();
        return this.list().filter((entry) => entry.name.includes(normalized) || (entry.description?.toLowerCase().includes(normalized) ?? false));
    }
    register(entry) {
        this.entries.set(entry.id, entry);
    }
}
//# sourceMappingURL=index.js.map