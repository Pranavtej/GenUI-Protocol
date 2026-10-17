import { Component, computed, forwardRef, inject, input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RuntimeNode } from "@genui-protocol/runtime-core";
import { DynamicRendererComponent } from "../dynamic-renderer.component";
import { GENUI_SESSION, runActions, writeField } from "../session";

const asStr = (x: unknown, fallback = ""): string => (x === undefined || x === null ? fallback : typeof x === "object" ? JSON.stringify(x) : String(x));
const asArr = <T = Record<string, unknown>>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

const STATUS_CLASS: Record<string, string> = {
  completed: "bg-green-500", success: "bg-green-500", active: "bg-primary", running: "bg-primary", current: "bg-primary",
  pending: "bg-muted-foreground", idle: "bg-muted-foreground", upcoming: "bg-muted-foreground", failed: "bg-red-500", error: "bg-red-500",
};

@Component({
  selector: "genui-stack-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
  template: `
    <div class="flex" [class.flex-col]="!horizontal()" [style.gap.px]="gap()">
      @for (child of node().children; track child.id) {
        <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
      }
    </div>
  `
})
export class StackRenderer {
  node = input.required<RuntimeNode>();
  horizontal = computed(() => this.node().p?.["direction"] === "horizontal");
  gap = computed(() => { const g = Number(this.node().p?.["gap"]); return Number.isFinite(g) ? g : 12; });
}

@Component({
  selector: "genui-tabs-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
  template: `
    <div>
      <div role="tablist" class="flex gap-1 border-b border-border">
        @for (item of items(); track $index) {
          <button type="button" role="tab" class="px-4 py-2 text-sm border-b-2"
                  [class.border-primary]="$index === activeIndex()" [class.text-primary]="$index === activeIndex()"
                  [class.border-transparent]="$index !== activeIndex()" [class.text-muted-foreground]="$index !== activeIndex()"
                  [attr.aria-selected]="$index === activeIndex()" (click)="select(item)">
            {{ label(item) }}
          </button>
        }
      </div>
      <div role="tabpanel" class="pt-4">
        @if (activeChild(); as child) {
          <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
        }
      </div>
    </div>
  `
})
export class TabsRenderer {
  node = input.required<RuntimeNode>();
  private session = inject(GENUI_SESSION, { optional: true });
  private local = signal<string | null>(null);
  items = computed(() => asArr<{ label?: unknown; value?: unknown }>(this.node().p?.["items"]));
  private active = computed(() => this.local() ?? asStr(this.node().p?.["activeTab"], asStr(this.items()[0]?.value)));
  activeIndex = computed(() => Math.max(0, this.items().findIndex((i) => asStr(i.value) === this.active())));
  activeChild = computed(() => this.node().children?.[this.activeIndex()] ?? null);
  label(item: { label?: unknown; value?: unknown }) { return asStr(item.label ?? item.value); }
  select(item: { value?: unknown }) {
    const value = asStr(item.value);
    this.local.set(value);
    writeField(this.session, this.node(), "activeTab", value);
    runActions(this.session, this.node(), "onTabChange", { value });
  }
}

@Component({
  selector: "genui-dialog-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 bg-black/45" [class.flex]="!side()" [class.justify-center]="!side()">
        <div role="dialog" aria-modal="true" [attr.aria-label]="title()"
             class="bg-card text-card-foreground border border-border shadow-lg p-4"
             [class.mt-[10vh]]="!side()" [class.rounded-md]="!side()" [class.w-full]="!side()" [class.max-w-lg]="!side()" [class.h-fit]="!side()"
             [class.absolute]="!!side()" [class.top-0]="!!side()" [class.bottom-0]="!!side()" [class.w-[360px]]="!!side()"
             [class.left-0]="side() === 'left'" [class.right-0]="side() === 'right'">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">{{ title() }}</h2>
            <button type="button" aria-label="Close" class="px-2" (click)="close()">✕</button>
          </div>
          @if (description()) { <p class="text-muted-foreground">{{ description() }}</p> }
          <div class="flex flex-col gap-4">
            @for (child of node().children; track child.id) {
              <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class DialogRenderer {
  node = input.required<RuntimeNode>();
  private session = inject(GENUI_SESSION, { optional: true });
  open = computed(() => this.node().p?.["open"] === true);
  title = computed(() => asStr(this.node().p?.["title"]));
  description = computed(() => asStr(this.node().p?.["description"]));
  /** null = centered dialog. */
  side = computed<"left" | "right" | null>(() => null);
  close() { runActions(this.session, this.node(), "onClose"); }
}

@Component({
  selector: "genui-drawer-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 bg-black/45">
        <div role="dialog" aria-modal="true" [attr.aria-label]="title()"
             class="absolute top-0 bottom-0 w-[360px] max-w-[90vw] bg-card text-card-foreground border border-border shadow-lg p-4"
             [class.left-0]="side() === 'left'" [class.right-0]="side() === 'right'">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">{{ title() }}</h2>
            <button type="button" aria-label="Close" class="px-2" (click)="close()">✕</button>
          </div>
          <div class="flex flex-col gap-4">
            @for (child of node().children; track child.id) {
              <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class DrawerRenderer {
  node = input.required<RuntimeNode>();
  private session = inject(GENUI_SESSION, { optional: true });
  open = computed(() => this.node().p?.["open"] === true);
  title = computed(() => asStr(this.node().p?.["title"]));
  side = computed<"left" | "right">(() => (this.node().p?.["position"] === "left" ? "left" : "right"));
  close() { runActions(this.session, this.node(), "onClose"); }
}

@Component({
  selector: "genui-workflow-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol class="flex flex-col gap-3 rounded-md border border-border bg-card p-4 list-none m-0">
      @for (step of steps(); track $index) {
        <li class="flex items-center gap-2" [attr.data-status]="status(step)">
          <span aria-hidden="true" class="inline-block h-3 w-3 rounded-full" [ngClass]="dot(step)"></span>
          <span class="font-semibold">{{ text(step['name']) }}</span>
          <span class="text-sm text-muted-foreground">{{ status(step) }}@if (step['duration']) { · {{ text(step['duration']) }} }</span>
        </li>
      }
    </ol>
  `
})
export class WorkflowRenderer {
  node = input.required<RuntimeNode>();
  steps = computed(() => asArr(this.node().p?.["steps"]));
  text = (x: unknown) => asStr(x);
  status = (s: Record<string, unknown>) => asStr(s["status"]);
  dot = (s: Record<string, unknown>) => STATUS_CLASS[this.status(s)] ?? "bg-muted-foreground";
}

@Component({
  selector: "genui-timeline-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol class="m-0 list-none border-l-2 border-border p-0">
      @for (item of items(); track $index) {
        <li class="relative pb-4 pl-4" [attr.data-status]="text(item['status'])">
          <span aria-hidden="true" class="absolute -left-[7px] top-1 h-3 w-3 rounded-full" [ngClass]="dot(item)"></span>
          <div class="font-semibold">{{ text(item['title']) }}</div>
          <div class="text-sm text-muted-foreground">{{ text(item['date']) }}</div>
          @if (item['description']) { <div>{{ text(item['description']) }}</div> }
        </li>
      }
    </ol>
  `
})
export class TimelineRenderer {
  node = input.required<RuntimeNode>();
  items = computed(() => asArr(this.node().p?.["items"]));
  text = (x: unknown) => asStr(x);
  dot = (s: Record<string, unknown>) => STATUS_CLASS[asStr(s["status"])] ?? "bg-muted-foreground";
}

@Component({
  selector: "genui-execution-graph-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto rounded-md border border-border bg-card p-4">
      <svg role="img" aria-label="Execution graph" [attr.width]="width()" height="96">
        @for (edge of edgeLines(); track $index) {
          <line [attr.x1]="edge.x1" [attr.y1]="edge.y" [attr.x2]="edge.x2" [attr.y2]="edge.y" stroke="currentColor" stroke-width="2"></line>
        }
        @for (n of laidOut(); track $index) {
          <g [attr.data-status]="n.status">
            <rect [attr.x]="n.x" y="20" width="160" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="2"></rect>
            <text [attr.x]="n.x + 80" y="52" text-anchor="middle" font-size="13" fill="currentColor">{{ n.label }}</text>
          </g>
        }
      </svg>
    </div>
  `
})
export class ExecutionGraphRenderer {
  node = input.required<RuntimeNode>();
  laidOut = computed(() => asArr(this.node().p?.["nodes"]).map((n, i) => ({ id: asStr(n["id"]), label: asStr(n["label"]), status: asStr(n["status"]), x: 10 + i * 220 })));
  width = computed(() => Math.max(200, 20 + this.laidOut().length * 220));
  edgeLines = computed(() => {
    const pos = new Map(this.laidOut().map((n) => [n.id, n.x]));
    return asArr(this.node().p?.["edges"]).flatMap((e) => {
      const a = pos.get(asStr(e["from"] ?? e["source"]));
      const b = pos.get(asStr(e["to"] ?? e["target"]));
      return a === undefined || b === undefined ? [] : [{ x1: a + 160, x2: b, y: 48 }];
    });
  });
}

export const GENUI_EXTRA_RENDERERS = [
  StackRenderer, TabsRenderer, DialogRenderer, DrawerRenderer, WorkflowRenderer, TimelineRenderer, ExecutionGraphRenderer,
];
