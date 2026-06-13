import { Component, OnInit, OnDestroy, effect, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeTree, buildRuntimeTree, applyPatch } from "@ainative-ui/runtime-core";
import { eventRouter, UIEvent } from "@ainative-ui/event-engine";
import { DynamicRendererComponent } from "@ainative-ui/renderer-angular";
import { ASTDocument } from "@ainative-ui/ast";
import { ASTPatch } from "@ainative-ui/protocol";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule, FormsModule, DynamicRendererComponent,
  ],
  template: `
    <div class="h-screen w-screen flex flex-col bg-background text-foreground">
      <!-- HEADER -->
      <header class="flex items-center justify-between px-6 h-14 bg-card border-b">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
          <h1 class="text-lg font-bold tracking-tight">GenUI Protocol</h1>
          <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">v1.0.0</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                [class.bg-primary]="status()==='connected'" [class.text-primary-foreground]="status()==='connected'" [class.border-primary]="status()==='connected'"
                [class.bg-destructive]="status()==='error'" [class.text-destructive-foreground]="status()==='error'" [class.border-destructive]="status()==='error'"
                [class.text-muted-foreground]="status()!=='connected' && status()!=='error'">
            {{ status() }}
          </span>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border bg-transparent hover:bg-accent transition-colors"
                  (click)="toggleTheme()">
            {{ isDark() ? 'Light' : 'Dark' }}
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <div class="flex-1 grid grid-cols-[1fr_320px] overflow-hidden">
        <!-- CANVAS -->
        <main class="overflow-auto p-6">
          @if (runtimeTree()) {
            <guip-dynamic-renderer [node]="runtimeTree()!.root"></guip-dynamic-renderer>
          } @else {
            <div class="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9 9 0 0112.162 0M12 4v1m0 4v2m0 4v1"></path>
              </svg>
              <p class="text-sm">Waiting for AST stream from MCP server...</p>
              <p class="text-xs opacity-50">POST to <code class="text-primary">http://localhost:4000/api/stream_ast</code></p>
            </div>
          }
        </main>

        <!-- EVENT LOG -->
        <aside class="border-l flex flex-col bg-card">
          <div class="flex items-center justify-between px-4 h-10 border-b">
            <span class="text-sm font-medium">Event Log</span>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 hover:bg-accent transition-colors"
                    (click)="clearLogs()">Clear</button>
          </div>
          <div class="flex-1 overflow-y-auto scrollbar-thin">
            <div class="p-3 space-y-2">
              @for (log of logs(); track $index) {
                <div class="p-2 rounded-md border bg-muted/30 text-xs font-mono">
                  <div class="flex items-center justify-between mb-1">
                    <span class="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold"
                          [class.bg-primary]="log.type==='click'" [class.text-primary-foreground]="log.type==='click'"
                          [class.text-muted-foreground]="log.type!=='click'">
                      {{ log.type }}
                    </span>
                    <span class="text-muted-foreground">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
                  </div>
                  <div class="text-muted-foreground">ID: {{ log.target }}</div>
                  @if (log.payload) {
                    <pre class="mt-1 text-primary">{{ serialize(log.payload) }}</pre>
                  }
                </div>
              } @empty {
                <p class="text-center text-xs text-muted-foreground py-8">No events yet</p>
              }
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 2px; }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  isDark = signal(true);
  status = signal<"connected" | "disconnected" | "error">("disconnected");
  runtimeTree = signal<RuntimeTree | null>(null);
  logs = signal<UIEvent[]>([]);

  private eventSource?: EventSource;

  constructor() {
    effect(() => {
      if (this.isDark()) {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    });

    eventRouter.subscribeGlobal((ev: UIEvent) => {
      this.logs.update((current) => [ev, ...current]);
    });
  }

  toggleTheme() { this.isDark.update(v => !v); }
  clearLogs() { this.logs.set([]); }

  ngOnInit(): void { this.connectStream(); }
  ngOnDestroy(): void { this.disconnectStream(); }

  private connectStream() {
    this.status.set("disconnected");
    try {
      this.eventSource = new EventSource("http://localhost:4000/api/stream");
      this.eventSource.onopen = () => this.status.set("connected");
      this.eventSource.onerror = () => this.status.set("error");
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ast") {
            this.runtimeTree.set(buildRuntimeTree(data.ast as ASTDocument));
          } else if (data.type === "patch") {
            const patches = data.patches as ASTPatch[];
            let tree = this.runtimeTree();
            if (tree) {
              for (const patch of patches) tree = applyPatch(tree, patch);
              this.runtimeTree.set(tree);
            }
          }
        } catch {}
      };
    } catch {
      this.status.set("error");
    }
  }

  private disconnectStream() { this.eventSource?.close(); }

  serialize(val: any) { return JSON.stringify(val); }
}
