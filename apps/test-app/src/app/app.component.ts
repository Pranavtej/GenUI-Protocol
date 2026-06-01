import { Component, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RuntimeTree, buildRuntimeTree, applyPatch } from "@ainative-ui/runtime-core";
import { eventRouter, UIEvent } from "@ainative-ui/event-engine";
import { DynamicRendererComponent } from "@ainative-ui/renderer-angular";
import { ASTDocument } from "@ainative-ui/ast";
import { ASTPatch } from "@ainative-ui/protocol";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [CommonModule, DynamicRendererComponent],
    template: `
        <div class="test-app-layout">
            <!-- MAIN HEADER -->
            <header class="app-header">
                <div class="flex items-center space-x-3">
                    <span class="pulse-indicator" [ngClass]="status()"></span>
                    <h1 class="text-xl font-bold">GenUI Agent Testbed</h1>
                </div>
                <div class="status-badge" [ngClass]="status()">
                    SSE: <span class="capitalize font-bold">{{ status() }}</span>
                </div>
            </header>

            <!-- WORKSPACE -->
            <div class="workspace-grid">
                <!-- RENDERER CANVAS -->
                <main class="canvas-panel">
                    <div class="panel-heading">
                        <h3>Interactive Live Render</h3>
                        <p class="text-slate-500 text-xs mt-1">Accepting live streamed payloads from local MCP server</p>
                    </div>
                    <div class="canvas-content">
                        @if (runtimeTree()) {
                            <guip-dynamic-renderer [node]="runtimeTree()!.root"></guip-dynamic-renderer>
                        } @else {
                            <div class="canvas-empty">
                                <svg class="w-12 h-12 text-slate-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9 9 0 0112.162 0M12 4v1m0 4v2m0 4v1"></path></svg>
                                <p class="mt-4 text-sm text-slate-400">Waiting for agent to stream AST...</p>
                                <div class="stream-tip">
                                    Send a POST request to <code>http://localhost:4000/api/stream_ast</code> to initialize rendering.
                                </div>
                            </div>
                        }
                    </div>
                </main>

                <!-- TELEMETRY DEVTOOLS -->
                <aside class="devtools-panel">
                    <div class="panel-heading flex justify-between items-center">
                        <h3>Agent Event Log</h3>
                        <button class="clear-btn" (click)="clearLogs()">Clear</button>
                    </div>
                    <div class="logs-container">
                        @for (log of logs(); track $index) {
                            <div class="log-entry">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="log-type">{{ log.type }}</span>
                                    <span class="log-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
                                </div>
                                <div class="log-details">
                                    <strong>Target ID:</strong> {{ log.target }}
                                    @if (log.payload) {
                                        <pre class="log-json">payload: {{ serialize(log.payload) }}</pre>
                                    }
                                </div>
                            </div>
                        } @empty {
                            <div class="logs-empty">
                                Event stream is idle. Interactions on components will be broadcasted here.
                            </div>
                        }
                    </div>
                </aside>
            </div>
        </div>
    `
})
export class AppComponent implements OnInit, OnDestroy {
    status = signal<"connected" | "disconnected" | "error">("disconnected");
    runtimeTree = signal<RuntimeTree | null>(null);
    logs = signal<UIEvent[]>([]);

    private eventSource?: EventSource;

    constructor() {
        // Log client actions
        eventRouter.subscribeGlobal((ev: UIEvent) => {
            this.logs.update((current) => [ev, ...current]);
        });
    }

    ngOnInit(): void {
        this.connectStream();
    }

    ngOnDestroy(): void {
        this.disconnectStream();
    }

    private connectStream() {
        this.status.set("disconnected");
        try {
            this.eventSource = new EventSource("http://localhost:4000/api/stream");

            this.eventSource.onopen = () => {
                this.status.set("connected");
                console.log("SSE connected to MCP stream");
            };

            this.eventSource.onerror = (err) => {
                this.status.set("error");
                console.error("SSE stream error:", err);
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "ast") {
                        const ast = data.ast as ASTDocument;
                        this.runtimeTree.set(buildRuntimeTree(ast));
                        console.log("Loaded full AST from stream");
                    } else if (data.type === "patch") {
                        const patches = data.patches as ASTPatch[];
                        let tree = this.runtimeTree();
                        if (tree) {
                            for (const patch of patches) {
                                tree = applyPatch(tree, patch);
                            }
                            this.runtimeTree.set(tree);
                            console.log(`Applied ${patches.length} patches from stream`);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse stream event data:", e);
                }
            };
        } catch (e) {
            this.status.set("error");
        }
    }

    private disconnectStream() {
        if (this.eventSource) {
            this.eventSource.close();
        }
    }

    clearLogs() {
        this.logs.set([]);
    }

    serialize(val: any) {
        return JSON.stringify(val);
    }
}
