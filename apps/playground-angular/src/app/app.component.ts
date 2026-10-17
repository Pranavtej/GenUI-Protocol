import { Component, OnInit, signal, computed, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeTree, buildRuntimeTree, reconcile, diffRuntimeTree, applyPatch } from "@genui-protocol/runtime-core";
import { validateASTDocument } from "@genui-protocol/validation";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { eventRouter, UIEvent } from "@genui-protocol/event-engine";
import { DynamicRendererComponent, GenUiButton, GenUiBadge, GenUiScrollArea, GenUiTabs } from "@genui-protocol/angular";
import { defaultASTDocument, ASTDocument, UINode } from "@genui-protocol/ast";
import { ASTPatch } from "@genui-protocol/protocol";

const registry = new ComponentRegistry();

const DEMO_PRESETS = {
  dashboard: {
    version: "1.0.0",
    root: {
      id: "p1", t: "page",
      p: { title: "Operations Dashboard", subtitle: "Live Agent Telemetry" },
      c: [
        {
          t: "grid", p: { columns: 3, gap: "var(--genui-spacing-md)" },
          c: [
            { id: "k1", t: "kpi", p: { label: "Revenue", value: "$45,230", subtext: "vs last month", trend: "up", trendValue: "+12%" } },
            { id: "k2", t: "kpi", p: { label: "Reasoning Steps", value: "348", subtext: "agent execution", trend: "up", trendValue: "+42" } },
            { id: "k3", t: "kpi", p: { label: "Server Status", value: "Degraded", subtext: "zone us-west", trend: "down", trendValue: "2 errors" } },
          ]
        },
        {
          t: "card", p: { title: "Ingestion Controls" },
          c: [
            { t: "flex", p: { gap: "var(--genui-spacing-md)", justifyContent: "space-between", alignItems: "center" },
              c: [
                { id: "input1", t: "input", p: { label: "Filter", placeholder: "e.g. error" } },
                { id: "btn1", t: "button", p: { label: "Execute", variant: "default" } },
              ]
            }
          ]
        },
        {
          t: "section", p: { title: "Data Table" },
          c: [{
            t: "table", p: {
              columns: [
                { header: "Name", accessor: "name" },
                { header: "Status", accessor: "status" },
                { header: "Value", accessor: "value" },
              ],
              data: [
                { name: "Alpha", status: "Running", value: "85%" },
                { name: "Beta", status: "Completed", value: "100%" },
                { name: "Gamma", status: "Failed", value: "23%" },
              ]
            }
          }]
        }
      ]
    }
  },
  form: {
    version: "1.0.0",
    root: {
      id: "f1", t: "card",
      p: { title: "User Registration" },
      c: [
        { id: "f2", t: "input", p: { label: "Username", placeholder: "Enter username" } },
        { id: "f3", t: "input", p: { label: "Password", placeholder: "Enter password" } },
        { id: "f4", t: "select", p: { label: "Role", options: [{ label: "Admin", value: "admin" }, { label: "User", value: "user" }] } },
        { id: "f5", t: "checkbox", p: { label: "Subscribe to newsletter", checked: true } },
        { id: "f6", t: "button", p: { label: "Create Account", variant: "default" } },
      ]
    }
  },
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule, FormsModule, DynamicRendererComponent,
    GenUiButton, GenUiBadge, GenUiScrollArea, GenUiTabs,
  ],
  template: `
    <div class="h-screen w-screen flex flex-col bg-background text-foreground">
      <!-- TOP NAV -->
      <header class="flex items-center justify-between px-6 h-14 border-b bg-card">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.7)]"></span>
          <h1 class="text-lg font-bold">GenUI Playground</h1>
          <genui-badge variant="secondary">Angular</genui-badge>
        </div>
        <div class="flex items-center gap-2">
          <genui-button variant="ghost" size="sm" (onClick)="loadPreset('dashboard')">Dashboard</genui-button>
          <genui-button variant="ghost" size="sm" (onClick)="loadPreset('form')">Form</genui-button>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border bg-transparent hover:bg-accent transition-colors"
                  (click)="toggleTheme()">
            {{ isDark() ? 'Light' : 'Dark' }}
          </button>
        </div>
      </header>

      <!-- WORKSPACE -->
      <div class="flex-1 grid grid-cols-[380px_1fr_300px] overflow-hidden">
        <!-- LEFT: Editor -->
        <aside class="flex flex-col border-r bg-card">
          <div class="flex items-center gap-1 px-4 h-10 border-b">
            <genui-tabs [tabs]="leftTabs" [active]="leftTab()" (onTabChange)="setLeftTab($event)"></genui-tabs>
          </div>
          <div class="flex-1 overflow-auto p-4">
            @if (leftTab() === 'editor') {
              <div class="flex flex-col h-full gap-3">
                <textarea class="flex-1 font-mono text-xs p-3 rounded-md border bg-background resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  [(ngModel)]="rawAST" (input)="onASTChange()"></textarea>
                <div class="flex items-center gap-2 p-2 rounded-md text-xs"
                  [class.text-emerald-500]="validation().valid"
                  [class.text-destructive]="!validation().valid">
                  <span class="w-2 h-2 rounded-full"
                    [class.bg-emerald-500]="validation().valid"
                    [class.bg-destructive]="!validation().valid"></span>
                  {{ validation().valid ? 'Valid AST' : validation().errors[0] }}
                </div>
              </div>
            }
            @if (leftTab() === 'components') {
              <div class="space-y-2">
                <input class="w-full h-9 rounded-md border bg-background px-3 text-sm" placeholder="Search..." [(ngModel)]="searchQuery">
                @for (comp of filteredComponents(); track $index) {
                  <div class="p-3 rounded-md border bg-background">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-medium text-sm">{{ comp.name }}</span>
                      <genui-badge variant="outline" class="text-[10px]">{{ comp.category }}</genui-badge>
                    </div>
                    <p class="text-xs text-muted-foreground">{{ comp.description }}</p>
                  </div>
                }
              </div>
            }
            @if (leftTab() === 'schemas') {
              <div class="space-y-3">
                <select class="w-full h-9 rounded-md border bg-background px-3 text-sm" [(ngModel)]="selectedSchemaComponent">
                  @for (comp of components(); track $index) {
                    <option [value]="comp.id">{{ comp.name }}</option>
                  }
                </select>
                <pre class="p-3 rounded-md border bg-background text-xs overflow-auto max-h-96 text-primary">
                  <code>{{ schemaPreview() }}</code>
                </pre>
              </div>
            }
          </div>
        </aside>

        <!-- CENTER: Canvas -->
        <main class="overflow-auto p-6">
          @if (runtimeTree() && validation().valid) {
            <genui-dynamic-renderer [node]="runtimeTree()!.root"></genui-dynamic-renderer>
          } @else {
            <div class="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <svg class="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <p class="text-sm">Fix validation errors to render preview</p>
            </div>
          }
        </main>

        <!-- RIGHT: DevTools -->
        <aside class="flex flex-col border-l bg-card">
          <div class="flex items-center gap-1 px-4 h-10 border-b">
            <genui-tabs [tabs]="rightTabs" [active]="rightTab()" (onTabChange)="setRightTab($event)"></genui-tabs>
          </div>
          <genui-scroll-area class="flex-1" maxHeight="100%">
            <div class="p-3 space-y-2">
              @if (rightTab() === 'events') {
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-muted-foreground">Event Stream</span>
                  <genui-button variant="ghost" size="sm" (onClick)="clearEvents()">Clear</genui-button>
                </div>
                @for (ev of events(); track $index) {
                  <div class="p-2 rounded-md border text-xs font-mono bg-background">
                    <div class="flex justify-between mb-1">
                      <genui-badge variant="secondary" class="text-[10px] px-1 py-0">{{ ev.type }}</genui-badge>
                      <span class="text-muted-foreground">{{ ev.timestamp | date:'HH:mm:ss.SSS' }}</span>
                    </div>
                    <div class="text-muted-foreground">target: {{ ev.target }}</div>
                  </div>
                } @empty {
                  <p class="text-center text-xs text-muted-foreground py-8">No events</p>
                }
              }
              @if (rightTab() === 'patches') {
                @for (p of patches(); track $index) {
                  <div class="p-2 rounded-md border text-xs font-mono bg-background"
                    [class.border-l-emerald-500]="p.op === 'add'"
                    [class.border-l-destructive]="p.op === 'remove'"
                    [class.border-l-amber-500]="p.op === 'replace'">
                    <genui-badge variant="outline" class="text-[10px] px-1 py-0">{{ p.op }}</genui-badge>
                    <span class="ml-2 text-muted-foreground">{{ p.path }}</span>
                  </div>
                } @empty {
                  <p class="text-center text-xs text-muted-foreground py-8">No patches</p>
                }
              }
              @if (rightTab() === 'state') {
                <div class="grid grid-cols-2 gap-2 border-b pb-2 mb-2 text-xs font-medium text-muted-foreground">
                  <span>Signal</span><span>Value</span>
                </div>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between"><span>theme</span><span class="text-primary">"dark"</span></div>
                  <div class="flex justify-between"><span>nodes</span><span class="text-primary">{{ nodesCount() }}</span></div>
                  <div class="flex justify-between"><span>zoneless</span><span class="text-emerald-500">true</span></div>
                </div>
              }
            </div>
          </genui-scroll-area>
        </aside>
      </div>
    </div>
  `,
  styles: [`:host { display: contents; }`],
})
export class AppComponent implements OnInit {
  isDark = signal(true);
  leftTab = signal("editor");
  rightTab = signal("events");
  leftTabs = [
    { label: "Editor", value: "editor" },
    { label: "Components", value: "components" },
    { label: "Schemas", value: "schemas" },
  ];
  rightTabs = [
    { label: "Events", value: "events" },
    { label: "Patches", value: "patches" },
    { label: "State", value: "state" },
  ];

  rawAST = "";
  searchQuery = "";
  selectedSchemaComponent = "";
  runtimeTree = signal<RuntimeTree | null>(null);
  events = signal<UIEvent[]>([]);
  patches = signal<ASTPatch[]>([]);
  components = signal(registry.list());

  constructor() {
    effect(() => {
      if (this.isDark()) {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    });

    eventRouter.subscribeGlobal((ev: UIEvent) => {
      this.events.update((list) => [ev, ...list]);
    });
  }

  ngOnInit(): void {
    this.loadPreset("dashboard");
  }

  setLeftTab(tab: string) { this.leftTab.set(tab); }
  setRightTab(tab: string) { this.rightTab.set(tab); }

  loadPreset(type: "dashboard" | "form") {
    const preset = DEMO_PRESETS[type];
    this.rawAST = JSON.stringify(preset, null, 2);
    this.parseAndRender(preset as unknown as ASTDocument);
  }

  onASTChange() {
    try {
      this.parseAndRender(JSON.parse(this.rawAST));
    } catch {}
  }

  validation = computed(() => {
    try {
      const doc = JSON.parse(this.rawAST);
      if (!doc.root) return { valid: false, errors: ["Missing root"] };
      return doc.root.t ? { valid: true, errors: [] } : { valid: false, errors: ["Invalid root node"] };
    } catch (e: any) {
      return { valid: false, errors: [e.message] };
    }
  });

  filteredComponents = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.components().filter((c: any) => c.name.includes(q) || c.description?.toLowerCase().includes(q));
  });

  schemaPreview() {
    const item = this.components().find((c: any) => c.id === this.selectedSchemaComponent);
    return item ? JSON.stringify(item.schema, null, 2) : "{}";
  }

  nodesCount = computed(() => {
    const tree = this.runtimeTree();
    if (!tree) return 0;
    let count = 0;
    const walk = (n: any) => { count++; n.c?.forEach(walk); };
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
        this.runtimeTree.set(reconcile(doc, currentTree));
      }
    } else {
      this.runtimeTree.set(nextTree);
    }
  }

  clearEvents() { this.events.set([]); }
  toggleTheme() { this.isDark.update(v => !v); }
}