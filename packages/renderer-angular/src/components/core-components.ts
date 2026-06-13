import { Component, Input, computed, forwardRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeNode } from "@ainative-ui/runtime-core";
import { eventRouter } from "@ainative-ui/event-engine";
import { DynamicRendererComponent } from "../dynamic-renderer.component";
import {
  GuipCard, GuipButton, GuipText, GuipHeading,
  GuipTable, GuipThead, GuipTbody, GuipTr, GuipTh, GuipTd,
  GuipInput, GuipStack, GuipFlex, GuipGrid, GuipKpi,
  GuipSelect, GuipCheckbox,
} from "@ainative-ui/renderer-angular-ui";

export interface GuipComponent { node: RuntimeNode; }

function str(p: any, key: string, fallback = ""): string {
  return String(p?.[key] ?? fallback);
}

function num(p: any, key: string, fallback: number): number {
  const v = Number(p?.[key]);
  return isNaN(v) ? fallback : v;
}

function bool(p: any, key: string): boolean {
  return p?.[key] === true;
}

@Component({
  selector: "guip-page",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GuipCard, GuipStack],
  template: `
    <div class="min-h-screen bg-background p-6">
      <guip-card [title]="pageTitle" [subtitle]="pageSubtitle">
        <guip-stack gap="var(--guip-spacing-lg)">
          @for (child of node.children; track child.id) {
            <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
          }
        </guip-stack>
      </guip-card>
    </div>
  `
})
export class PageRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get pageTitle(): string { return str(this.node.p, "title"); }
  get pageSubtitle(): string { return str(this.node.p, "subtitle"); }
}

@Component({
  selector: "guip-section",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GuipCard, GuipStack],
  template: `
    <guip-card [title]="sectionTitle" [subtitle]="sectionDesc">
      <guip-stack gap="var(--guip-spacing-md)">
        @for (child of node.children; track child.id) {
          <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
        }
      </guip-stack>
    </guip-card>
  `
})
export class SectionRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get sectionTitle(): string { return str(this.node.p, "title"); }
  get sectionDesc(): string { return str(this.node.p, "description"); }
}

@Component({
  selector: "guip-card-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GuipCard, GuipStack],
  template: `
    <guip-card [title]="cardTitle" [subtitle]="cardSub">
      <guip-stack gap="var(--guip-spacing-md)">
        @for (child of node.children; track child.id) {
          <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
        }
      </guip-stack>
    </guip-card>
  `
})
export class CardRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get cardTitle(): string { return str(this.node.p, "title"); }
  get cardSub(): string { return str(this.node.p, "subtitle"); }
}

@Component({
  selector: "guip-text-renderer",
  standalone: true,
  imports: [CommonModule, GuipText],
  template: `<guip-text>{{ textContent }}</guip-text>`
})
export class TextRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get textContent(): string { return str(this.node.p, "content"); }
}

@Component({
  selector: "guip-heading-renderer",
  standalone: true,
  imports: [CommonModule, GuipHeading],
  template: `<guip-heading [level]="headingLevel()">{{ headingText }}</guip-heading>`
})
export class HeadingRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get headingText(): string { return str(this.node.p, "text"); }
  headingLevel(): 1 | 2 | 3 | 4 | 5 | 6 {
    const level = Number(this.node.p?.["level"] || 2);
    if (level >= 1 && level <= 6) return level as 1 | 2 | 3 | 4 | 5 | 6;
    return 2;
  }
}

@Component({
  selector: "guip-button-renderer",
  standalone: true,
  imports: [CommonModule, GuipButton],
  template: `
    <guip-button (onClick)="onClick()" [variant]="btnVariant" [size]="btnSize">
      {{ btnLabel }}
    </guip-button>
  `
})
export class ButtonRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get btnLabel(): string { return str(this.node.p, "label"); }
  get btnVariant(): string { return str(this.node.p, "variant", "default"); }
  get btnSize(): string { return str(this.node.p, "size", "default"); }
  onClick() {
    eventRouter.dispatch({ type: "click", target: this.node.id, payload: { label: this.btnLabel } });
  }
}

@Component({
  selector: "guip-input-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GuipInput, GuipStack],
  template: `
    <guip-stack gap="var(--guip-spacing-sm)">
      <guip-input
        [placeholder]="inputPlaceholder"
        [disabled]="inputDisabled"
        [(ngModel)]="value"
        [label]="inputLabel"
        (input)="onInput()"
        (change)="onChange()"
      ></guip-input>
    </guip-stack>
  `
})
export class InputRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get inputPlaceholder(): string { return str(this.node.p, "placeholder"); }
  get inputLabel(): string { return str(this.node.p, "label"); }
  get inputDisabled(): boolean { return bool(this.node.p, "disabled"); }
  get value(): string { return str(this.node.p, "value"); }
  set value(val: string) {
    if (!this.node.p) this.node.p = {};
    this.node.p["value"] = val;
  }
  onInput() { eventRouter.dispatch({ type: "input", target: this.node.id, payload: { value: this.value } }); }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node.id, payload: { value: this.value } }); }
}

@Component({
  selector: "guip-textarea-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GuipStack],
  template: `
    <guip-stack gap="var(--guip-spacing-sm)">
      <textarea
        [placeholder]="taPlaceholder"
        [disabled]="taDisabled"
        [rows]="taRows"
        [(ngModel)]="value"
        (change)="onChange()"
        class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      ></textarea>
    </guip-stack>
  `
})
export class TextareaRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get taPlaceholder(): string { return str(this.node.p, "placeholder"); }
  get taDisabled(): boolean { return bool(this.node.p, "disabled"); }
  get taRows(): number { return num(this.node.p, "rows", 3); }
  get value(): string { return str(this.node.p, "value"); }
  set value(val: string) {
    if (!this.node.p) this.node.p = {};
    this.node.p["value"] = val;
  }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node.id, payload: { value: this.value } }); }
}

@Component({
  selector: "guip-select-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GuipSelect, GuipStack],
  template: `
    <guip-stack gap="var(--guip-spacing-sm)">
      <guip-select
        [label]="selLabel"
        [placeholder]="selPlaceholder"
        [options]="options()"
        [disabled]="selDisabled"
        [(ngModel)]="value"
        (change)="onChange()"
      ></guip-select>
    </guip-stack>
  `
})
export class SelectRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get selLabel(): string { return str(this.node.p, "label"); }
  get selPlaceholder(): string { return str(this.node.p, "placeholder"); }
  get selDisabled(): boolean { return bool(this.node.p, "disabled"); }
  options = computed(() => (this.node.p?.["options"] as { label: string; value: string }[]) || []);
  get value(): string { return str(this.node.p, "value"); }
  set value(val: string) {
    if (!this.node.p) this.node.p = {};
    this.node.p["value"] = val;
  }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node.id, payload: { value: this.value } }); }
}

@Component({
  selector: "guip-checkbox-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GuipCheckbox],
  template: `
    <guip-checkbox
      [label]="cbLabel"
      [(ngModel)]="checked"
      (change)="onChange()"
    ></guip-checkbox>
  `
})
export class CheckboxRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get cbLabel(): string { return str(this.node.p, "label"); }
  get checked(): boolean { return !!this.node.p?.["checked"]; }
  set checked(val: boolean) {
    if (!this.node.p) this.node.p = {};
    this.node.p["checked"] = val;
  }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node.id, payload: { checked: this.checked } }); }
}

@Component({
  selector: "guip-table-renderer",
  standalone: true,
  imports: [CommonModule, GuipTable, GuipThead, GuipTbody, GuipTr, GuipTh, GuipTd],
  template: `
    <div class="rounded-md border">
      <guip-table>
        <guip-thead>
          <guip-tr>
            @for (col of columns(); track col.accessor) {
              <guip-th>{{ col.header }}</guip-th>
            }
          </guip-tr>
        </guip-thead>
        <guip-tbody>
          @for (row of tableData(); track row['id'] || $index) {
            <guip-tr>
              @for (col of columns(); track col.accessor) {
                <guip-td>{{ row[col.accessor] }}</guip-td>
              }
            </guip-tr>
          }
        </guip-tbody>
      </guip-table>
    </div>
  `
})
export class TableRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  columns = computed(() => (this.node.p?.["columns"] as { header: string; accessor: string }[]) || []);
  tableData = computed(() => (this.node.p?.["data"] as Record<string, any>[]) || []);
}

@Component({
  selector: "guip-flex-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GuipFlex],
  template: `
    <guip-flex [gap]="flexGap" [justifyContent]="flexJustify" [alignItems]="flexAlign">
      @for (child of node.children; track child.id) {
        <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
      }
    </guip-flex>
  `
})
export class FlexRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get flexGap(): string { return str(this.node.p, "gap", "var(--guip-spacing-md)"); }
  get flexJustify(): string { return str(this.node.p, "justifyContent", "flex-start"); }
  get flexAlign(): string { return str(this.node.p, "alignItems", "stretch"); }
}

@Component({
  selector: "guip-grid-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GuipGrid],
  template: `
    <guip-grid [columns]="gridCols" [gap]="gridGap">
      @for (child of node.children; track child.id) {
        <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
      }
    </guip-grid>
  `
})
export class GridRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get gridCols(): number { return num(this.node.p, "columns", 1); }
  get gridGap(): string { return str(this.node.p, "gap", "var(--guip-spacing-md)"); }
}

@Component({
  selector: "guip-kpi-renderer",
  standalone: true,
  imports: [CommonModule, GuipKpi],
  template: `
    <guip-kpi [label]="kpiLabel" [value]="kpiValue"
              [subtext]="kpiSubtext" [trend]="kpiTrend" [trendValue]="kpiTrendValue">
    </guip-kpi>
  `
})
export class KpiRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
  get kpiLabel(): string { return str(this.node.p, "label"); }
  get kpiValue(): string { return str(this.node.p, "value"); }
  get kpiSubtext(): string { return str(this.node.p, "subtext"); }
  get kpiTrend(): "up" | "down" | "neutral" | "" {
    const v = this.node.p?.["trend"];
    if (v === "up" || v === "down" || v === "neutral") return v;
    return "";
  }
  get kpiTrendValue(): string { return str(this.node.p, "trendValue"); }
}

@Component({
  selector: "guip-dashboard-renderer",
  standalone: true,
  imports: [CommonModule, GuipStack, forwardRef(() => DynamicRendererComponent)],
  template: `
    <guip-stack gap="var(--guip-spacing-lg)">
      @for (child of node.children; track child.id) {
        <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
      }
    </guip-stack>
  `
})
export class DashboardRenderer implements GuipComponent {
  @Input({ required: true }) node!: RuntimeNode;
}

export const GUIP_CORE_RENDERERS = [
  PageRenderer, SectionRenderer, CardRenderer, TextRenderer, HeadingRenderer,
  ButtonRenderer, InputRenderer, TextareaRenderer, SelectRenderer, CheckboxRenderer,
  TableRenderer, FlexRenderer, GridRenderer, KpiRenderer, DashboardRenderer,
];