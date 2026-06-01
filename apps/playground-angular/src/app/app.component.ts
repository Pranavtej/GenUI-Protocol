import { Component, OnInit, signal, computed, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeTree, buildRuntimeTree, reconcile, diffRuntimeTree, applyPatch } from "@ainative-ui/runtime-core";
import { validateASTDocument } from "@ainative-ui/validation";
import { ComponentRegistry } from "@ainative-ui/component-registry";
import { eventRouter, UIEvent } from "@ainative-ui/event-engine";
import { DynamicRendererComponent } from "@ainative-ui/renderer-angular";
import { defaultASTDocument, ASTDocument, UINode } from "@ainative-ui/ast";
import { ASTPatch } from "@ainative-ui/protocol";

const registry = new ComponentRegistry();

const DEFAULT_PRESET: ASTDocument = {
    version: "1.0.0",
    root: {
        id: "p1",
        t: "page",
        p: { title: "Operations Hub", subtitle: "Live Agent Telemetry" },
        c: [
            {
                t: "grid",
                p: { cols: 3, gap: 4 },
                c: [
                    { id: "k1", t: "kpi", p: { label: "Revenue Growth", value: "$45,230", subtext: "vs last month", trend: "up", trendValue: "+12%" } },
                    { id: "k2", t: "kpi", p: { label: "Reasoning Steps", value: "348", subtext: "agent execution", trend: "up", trendValue: "+42 steps" } },
                    { id: "k3", t: "kpi", p: { label: "Server Status", value: "Degraded", subtext: "zone us-west", trend: "down", trendValue: "2 errors" } }
                ]
            },
            {
                t: "section",
                p: { title: "Agent Processing State", border: true },
                c: [
                    {
                        id: "eg1",
                        t: "executionGraph",
                        p: {
                            nodes: [
                                { id: "n1", label: "Retrieve Logs", type: "input", status: "success" },
                                { id: "n2", label: "Model Reasoning", type: "process", status: "running" },
                                { id: "n3", label: "Dynamic Output", type: "output", status: "idle" }
                            ],
                            edges: [
                                { source: "n1", target: "n2", animated: true },
                                { source: "n2", target: "n3", animated: false }
                            ]
                        }
                    }
                ]
            },
            {
                t: "card",
                p: { title: "Ingestion Controls" },
                c: [
                    {
                        t: "flex",
                        p: { direction: "row", gap: 4, align: "center", justify: "between" },
                        c: [
                            { id: "input1", t: "input", p: { label: "Filter Prefix", placeholder: "e.g. error" } },
                            { id: "btn1", t: "button", p: { label: "Execute Flush", variant: "destructive" } }
                        ]
                    }
                ]
            }
        ]
    }
};

@Component({
    selector: "app-root",
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicRendererComponent],
    template: `
        <div class="playground-layout" [ngClass]="themeClass()">
            <!-- TOP NAVBAR -->
            <header class="navbar">
                <div class="brand">
                    <span class="logo-glow"></span>
                    <h1>GUIP Playground <span class="badge">Reference v1.0</span></h1>
                </div>
                <div class="nav-actions">
                    <div class="theme-picker">
                        <button (click)="setTheme('dark')" [class.active]="theme() === 'dark'">Dark</button>
                        <button (click)="setTheme('neon')" [class.active]="theme() === 'neon'">Neon</button>
                        <button (click)="setTheme('light')" [class.active]="theme() === 'light'">Light</button>
                    </div>
                </div>
            </header>

            <div class="workspace">
                <!-- LEFT PANEL: Editor / Explorer -->
                <aside class="panel sidebar-left">
                    <div class="panel-header">
                        <div class="tab-selectors">
                            <button (click)="setLeftTab('editor')" [class.active]="leftTab() === 'editor'">AST Editor</button>
                            <button (click)="setLeftTab('components')" [class.active]="leftTab() === 'components'">Components</button>
                            <button (click)="setLeftTab('schemas')" [class.active]="leftTab() === 'schemas'">Schemas</button>
                        </div>
                    </div>
                    <div class="panel-body">
                        <!-- EDITOR TAB -->
                        @if (leftTab() === 'editor') {
                            <div class="editor-container">
                                <div class="presets-row">
                                    <button (click)="loadPreset('dashboard')">Dashboard</button>
                                    <button (click)="loadPreset('form')">Forms</button>
                                    <button (click)="loadPreset('workflow')">Workflow</button>
                                </div>
                                <textarea class="ast-textarea" 
                                          [(ngModel)]="rawAST" 
                                          (input)="onASTChange()"></textarea>
                                
                                <div class="validation-status" [ngClass]="validation().valid ? 'valid' : 'invalid'">
                                    <div class="status-header">
                                        <span class="indicator"></span>
                                        <strong>AST Validation: {{ validation().valid ? 'PASSED' : 'FAILED' }}</strong>
                                    </div>
                                    @if (!validation().valid) {
                                        <ul class="validation-errors">
                                            @for (err of validation().errors; track $index) {
                                                <li>{{ err }}</li>
                                            }
                                        </ul>
                                    }
                                </div>
                            </div>
                        }

                        <!-- COMPONENTS TAB -->
                        @if (leftTab() === 'components') {
                            <div class="explorer-container">
                                <input type="text" class="search-input" placeholder="Search registry..." [(ngModel)]="searchQuery" />
                                <div class="component-list">
                                    @for (comp of filteredComponents(); track comp.id) {
                                        <div class="component-card">
                                            <div class="comp-head">
                                                <strong>{{ comp.name }}</strong>
                                                <span class="comp-cat">{{ comp.category }}</span>
                                            </div>
                                            <p class="comp-desc">{{ comp.description }}</p>
                                            @if (comp.events && comp.events.length > 0) {
                                                <div class="comp-events">
                                                    <strong>Events:</strong>
                                                    @for (ev of comp.events; track ev) {
                                                        <span class="event-tag">{{ ev }}</span>
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        }

                        <!-- SCHEMAS TAB -->
                        @if (leftTab() === 'schemas') {
                            <div class="schema-container">
                                <select class="schema-select" [(ngModel)]="selectedSchemaComponent">
                                    @for (comp of components(); track comp.id) {
                                        <option [value]="comp.id">{{ comp.name }}</option>
                                    }
                                </select>
                                <pre class="schema-preview"><code>{{ schemaPreview() }}</code></pre>
                            </div>
                        }
                    </div>
                </aside>

                <!-- CENTER PANEL: Canvas Preview -->
                <main class="panel canvas-panel">
                    <div class="panel-header">
                        <div class="canvas-header-info">
                            <span class="pulse-node"></span>
                            <h2>Live Renderer Output (Angular)</h2>
                        </div>
                    </div>
                    <div class="panel-body canvas-body">
                        @if (runtimeTree() && validation().valid) {
                            <guip-dynamic-renderer [node]="runtimeTree()!.root"></guip-dynamic-renderer>
                        } @else {
                            <div class="canvas-fallback">
                                <svg class="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <p class="mt-4">Resolve validation errors to render preview.</p>
                            </div>
                        }
                    </div>
                </main>

                <!-- RIGHT PANEL: DevTools (Events, Patches, State) -->
                <aside class="panel sidebar-right">
                    <div class="panel-header">
                        <div class="tab-selectors">
                            <button (click)="setRightTab('events')" [class.active]="rightTab() === 'events'">Events</button>
                            <button (click)="setRightTab('patches')" [class.active]="rightTab() === 'patches'">Patches</button>
                            <button (click)="setRightTab('state')" [class.active]="rightTab() === 'state'">Signals</button>
                        </div>
                    </div>
                    <div class="panel-body font-mono text-xs">
                        <!-- EVENTS INSPECTOR -->
                        @if (rightTab() === 'events') {
                            <div class="inspect-list">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-slate-500 uppercase tracking-wide">Event Stream</span>
                                    <button class="clear-btn" (click)="clearEvents()">Clear</button>
                                </div>
                                @for (ev of events(); track $index) {
                                    <div class="log-item">
                                        <div class="log-meta">
                                            <span class="log-time">{{ ev.timestamp | date:'HH:mm:ss.SSS' }}</span>
                                            <span class="log-tag">{{ ev.type }}</span>
                                        </div>
                                        <pre class="log-content">target: {{ ev.target }}&#10;payload: {{ serialize(ev.payload) }}</pre>
                                    </div>
                                } @empty {
                                    <div class="inspect-empty">No events logged yet. Interact with rendering components (buttons, input fields) to trigger events.</div>
                                }
                            </div>
                        }

                        <!-- PATCHES INSPECTOR -->
                        @if (rightTab() === 'patches') {
                            <div class="inspect-list">
                                <span class="text-slate-500 uppercase tracking-wide mb-2 block">AST Reconciliation Patches</span>
                                @for (p of patches(); track $index) {
                                    <div class="log-item patch-item">
                                        <div class="log-meta">
                                            <span class="patch-op" [ngClass]="p.op">{{ p.op }}</span>
                                            <span class="patch-path">{{ p.path }}</span>
                                        </div>
                                        @if (p.value !== undefined) {
                                            <pre class="log-content">value: {{ serialize(p.value) }}</pre>
                                        }
                                    </div>
                                } @empty {
                                    <div class="inspect-empty">No patches generated. Modify properties in AST Editor to observe differences.</div>
                                }
                            </div>
                        }

                        <!-- STATE INSPECTOR -->
                        @if (rightTab() === 'state') {
                            <div class="inspect-list">
                                <span class="text-slate-500 uppercase tracking-wide mb-2 block">Active Signals</span>
                                <div class="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2 mb-2 font-bold text-slate-400">
                                    <span>Signal Name</span>
                                    <span>Value</span>
                                </div>
                                <div class="state-grid">
                                    <div class="state-row">
                                        <span>theme</span>
                                        <span class="state-val">"{{ theme() }}"</span>
                                    </div>
                                    <div class="state-row">
                                        <span>pageTitle</span>
                                        <span class="state-val">"{{ runtimeTree()?.root?.p?.['title'] }}"</span>
                                    </div>
                                    <div class="state-row">
                                        <span>nodesCount</span>
                                        <span class="state-val">{{ nodesCount() }}</span>
                                    </div>
                                    <div class="state-row">
                                        <span>isZoneless</span>
                                        <span class="state-val text-emerald-400">true</span>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </aside>
            </div>
        </div>
    `
})
export class AppComponent implements OnInit {
    theme = signal<"dark" | "neon" | "light">("neon");
    leftTab = signal<"editor" | "components" | "schemas">("editor");
    rightTab = signal<"events" | "patches" | "state">("events");

    rawAST = "";
    searchQuery = "";
    selectedSchemaComponent = "kpi";

    runtimeTree = signal<RuntimeTree | null>(null);
    events = signal<UIEvent[]>([]);
    patches = signal<ASTPatch[]>([]);

    components = signal(registry.list());

    constructor() {
        // Setup Event Bus listener
        eventRouter.subscribeGlobal((ev: UIEvent) => {
            this.events.update((list) => [ev, ...list]);
        });
    }

    ngOnInit(): void {
        this.rawAST = JSON.stringify(DEFAULT_PRESET, null, 2);
        this.parseAndRender(DEFAULT_PRESET);
    }

    themeClass() {
        return `theme-${this.theme()}`;
    }

    setTheme(t: "dark" | "neon" | "light") {
        this.theme.set(t);
    }

    setLeftTab(tab: "editor" | "components" | "schemas") {
        this.leftTab.set(tab);
    }

    setRightTab(tab: "events" | "patches" | "state") {
        this.rightTab.set(tab);
    }

    loadPreset(type: "dashboard" | "form" | "workflow") {
        let preset: ASTDocument;
        if (type === "workflow") {
            preset = {
                version: "1.0.0",
                root: {
                    t: "page",
                    p: { title: "CI Deployment Pipeline" },
                    c: [
                        {
                            t: "workflow",
                            p: {
                                steps: [
                                    { id: "1", name: "Checkout code", status: "completed", duration: "2s" },
                                    { id: "2", name: "Lint and Audit", status: "completed", duration: "12s" },
                                    { id: "3", name: "Compile Output", status: "completed", duration: "1.5m" },
                                    { id: "4", name: "Deploy Sandbox", status: "active" },
                                    { id: "5", name: "Smoke Tests", status: "pending" }
                                ]
                            }
                        },
                        {
                            t: "timeline",
                            p: {
                                items: [
                                    { title: "Sandbox compilation triggered", date: "12:00 PM", description: "Webpack bundle completed.", status: "completed" },
                                    { title: "Starting Sandbox container", date: "12:01 PM", description: "Deploying build artifacts to k8s cluster.", status: "current" }
                                ]
                            }
                        }
                    ]
                }
            };
        } else if (type === "form") {
            preset = {
                version: "1.0.0",
                root: {
                    t: "card",
                    p: { title: "User Registration" },
                    c: [
                        { id: "f1", t: "input", p: { label: "Username", placeholder: "Enter username" } },
                        { id: "f2", t: "input", p: { label: "Password", placeholder: "Enter password", type: "password" } },
                        { id: "f3", t: "select", p: { label: "User Role", options: [{ label: "Administrator", value: "admin" }, { label: "Standard User", value: "user" }] } },
                        { id: "f4", t: "checkbox", p: { label: "Subscribe to newsletter", checked: true } },
                        { id: "f5", t: "button", p: { label: "Create Account", variant: "default" } }
                    ]
                }
            };
        } else {
            preset = DEFAULT_PRESET;
        }

        this.rawAST = JSON.stringify(preset, null, 2);
        this.parseAndRender(preset);
    }

    onASTChange() {
        try {
            const parsed = JSON.parse(this.rawAST);
            this.parseAndRender(parsed);
        } catch (e) {
            // Wait for input to complete, don't crash
        }
    }

    validation = computed(() => {
        try {
            const doc = JSON.parse(this.rawAST);
            if (!doc.root) {
                return { valid: false, errors: ["Missing root property in AST document."] };
            }
            return validateASTDocument(doc.root, "angular");
        } catch (e: any) {
            return { valid: false, errors: [`JSON Parse error: ${e.message}`] };
        }
    });

    filteredComponents = computed(() => {
        const query = this.searchQuery.toLowerCase();
        return this.components().filter((c: any) => c.name.includes(query) || (c.description?.toLowerCase().includes(query) ?? false));
    });

    schemaPreview() {
        const item = this.components().find((c: any) => c.id === this.selectedSchemaComponent);
        return item ? JSON.stringify(item.schema, null, 2) : "";
    }

    nodesCount = computed(() => {
        const tree = this.runtimeTree();
        if (!tree) return 0;
        let count = 0;
        const walk = (n: UINode) => {
            count++;
            n.c?.forEach(walk);
        };
        walk(tree.root);
        return count;
    });

    private parseAndRender(doc: ASTDocument) {
        const nextTree = buildRuntimeTree(doc);
        const currentTree = this.runtimeTree();

        if (currentTree) {
            const treePatches = diffRuntimeTree(currentTree, nextTree);
            if (treePatches.length > 0) {
                this.patches.set(treePatches);
                const reconciledTree = reconcile(doc, currentTree);
                this.runtimeTree.set(reconciledTree);
            }
        } else {
            this.runtimeTree.set(nextTree);
        }
    }

    clearEvents() {
        this.events.set([]);
    }

    serialize(val: any) {
        return JSON.stringify(val);
    }
}
