import { Component, InputSignal, input, computed, forwardRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeNode } from "@genui-protocol/runtime-core";
import { eventRouter } from "@genui-protocol/event-engine";
import { DynamicRendererComponent } from "../dynamic-renderer.component";
import {
  GenUiCard, GenUiButton, GenUiText, GenUiHeading,
  GenUiTable, GenUiThead, GenUiTbody, GenUiTr, GenUiTh, GenUiTd,
  GenUiInput, GenUiStack, GenUiFlex, GenUiGrid, GenUiKpi,
  GenUiSelect, GenUiCheckbox,
  GenUiChart,
} from "../ui";

export interface GenUiComponent { node: InputSignal<RuntimeNode>; }

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
  selector: "genui-page",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GenUiCard, GenUiStack],
  template: `
    <div class="min-h-screen bg-background p-6">
      <genui-card [title]="pageTitle" [subtitle]="pageSubtitle">
        <genui-stack gap="var(--genui-spacing-lg)">
          @for (child of node().children; track child.id) {
            <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
          }
        </genui-stack>
      </genui-card>
    </div>
  `
})
export class PageRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get pageTitle(): string { return str(this.node().p, "title"); }
  get pageSubtitle(): string { return str(this.node().p, "subtitle"); }
}

@Component({
  selector: "genui-section",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GenUiCard, GenUiStack],
  template: `
    <genui-card [title]="sectionTitle" [subtitle]="sectionDesc">
      <genui-stack gap="var(--genui-spacing-md)">
        @for (child of node().children; track child.id) {
          <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
        }
      </genui-stack>
    </genui-card>
  `
})
export class SectionRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get sectionTitle(): string { return str(this.node().p, "title"); }
  get sectionDesc(): string { return str(this.node().p, "description"); }
}

@Component({
  selector: "genui-card-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GenUiCard, GenUiStack],
  template: `
    <genui-card [title]="cardTitle" [subtitle]="cardSub">
      <genui-stack gap="var(--genui-spacing-md)">
        @for (child of node().children; track child.id) {
          <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
        }
      </genui-stack>
    </genui-card>
  `
})
export class CardRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get cardTitle(): string { return str(this.node().p, "title"); }
  get cardSub(): string { return str(this.node().p, "subtitle"); }
}

@Component({
  selector: "genui-text-renderer",
  standalone: true,
  imports: [CommonModule, GenUiText],
  template: `<genui-text>{{ textContent }}</genui-text>`
})
export class TextRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get textContent(): string { return str(this.node().p, "content"); }
}

@Component({
  selector: "genui-heading-renderer",
  standalone: true,
  imports: [CommonModule, GenUiHeading],
  template: `<genui-heading [level]="headingLevel()">{{ headingText }}</genui-heading>`
})
export class HeadingRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get headingText(): string { return str(this.node().p, "text"); }
  headingLevel(): 1 | 2 | 3 | 4 | 5 | 6 {
    const level = Number(this.node().p?.["level"] || 2);
    if (level >= 1 && level <= 6) return level as 1 | 2 | 3 | 4 | 5 | 6;
    return 2;
  }
}

@Component({
  selector: "genui-button-renderer",
  standalone: true,
  imports: [CommonModule, GenUiButton],
  template: `
    <genui-button (onClick)="onClick()" [variant]="btnVariant" [size]="btnSize">
      {{ btnLabel }}
    </genui-button>
  `
})
export class ButtonRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get btnLabel(): string { return str(this.node().p, "label"); }
  get btnVariant(): string { return str(this.node().p, "variant", "default"); }
  get btnSize(): string { return str(this.node().p, "size", "default"); }
  onClick() {
    eventRouter.dispatch({ type: "click", target: this.node().id, payload: { label: this.btnLabel } });
  }
}

@Component({
  selector: "genui-input-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GenUiInput, GenUiStack],
  template: `
    <genui-stack gap="var(--genui-spacing-sm)">
      <genui-input
        [placeholder]="inputPlaceholder"
        [disabled]="inputDisabled"
        [(ngModel)]="value"
        [label]="inputLabel"
        (input)="onInput()"
        (change)="onChange()"
      ></genui-input>
    </genui-stack>
  `
})
export class InputRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get inputPlaceholder(): string { return str(this.node().p, "placeholder"); }
  get inputLabel(): string { return str(this.node().p, "label"); }
  get inputDisabled(): boolean { return bool(this.node().p, "disabled"); }
  get value(): string { return str(this.node().p, "value"); }
  set value(val: string) {
    const node = this.node();
    if (!node.p) node.p = {};
    node.p["value"] = val;
  }
  onInput() { eventRouter.dispatch({ type: "input", target: this.node().id, payload: { value: this.value } }); }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node().id, payload: { value: this.value } }); }
}

@Component({
  selector: "genui-textarea-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GenUiStack],
  template: `
    <genui-stack gap="var(--genui-spacing-sm)">
      <textarea
        [placeholder]="taPlaceholder"
        [disabled]="taDisabled"
        [rows]="taRows"
        [(ngModel)]="value"
        (change)="onChange()"
        class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      ></textarea>
    </genui-stack>
  `
})
export class TextareaRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get taPlaceholder(): string { return str(this.node().p, "placeholder"); }
  get taDisabled(): boolean { return bool(this.node().p, "disabled"); }
  get taRows(): number { return num(this.node().p, "rows", 3); }
  get value(): string { return str(this.node().p, "value"); }
  set value(val: string) {
    const node = this.node();
    if (!node.p) node.p = {};
    node.p["value"] = val;
  }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node().id, payload: { value: this.value } }); }
}

@Component({
  selector: "genui-select-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GenUiSelect, GenUiStack],
  template: `
    <genui-stack gap="var(--genui-spacing-sm)">
      <genui-select
        [label]="selLabel"
        [placeholder]="selPlaceholder"
        [options]="options()"
        [disabled]="selDisabled"
        [(ngModel)]="value"
        (change)="onChange()"
      ></genui-select>
    </genui-stack>
  `
})
export class SelectRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get selLabel(): string { return str(this.node().p, "label"); }
  get selPlaceholder(): string { return str(this.node().p, "placeholder"); }
  get selDisabled(): boolean { return bool(this.node().p, "disabled"); }
  options = computed(() => (this.node().p?.["options"] as { label: string; value: string }[]) || []);
  get value(): string { return str(this.node().p, "value"); }
  set value(val: string) {
    const node = this.node();
    if (!node.p) node.p = {};
    node.p["value"] = val;
  }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node().id, payload: { value: this.value } }); }
}

@Component({
  selector: "genui-checkbox-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, GenUiCheckbox],
  template: `
    <genui-checkbox
      [label]="cbLabel"
      [(ngModel)]="checked"
      (change)="onChange()"
    ></genui-checkbox>
  `
})
export class CheckboxRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get cbLabel(): string { return str(this.node().p, "label"); }
  get checked(): boolean { return !!this.node().p?.["checked"]; }
  set checked(val: boolean) {
    const node = this.node();
    if (!node.p) node.p = {};
    node.p["checked"] = val;
  }
  onChange() { eventRouter.dispatch({ type: "change", target: this.node().id, payload: { checked: this.checked } }); }
}

@Component({
  selector: "genui-table-renderer",
  standalone: true,
  imports: [CommonModule, GenUiTable, GenUiThead, GenUiTbody, GenUiTr, GenUiTh, GenUiTd],
  template: `
    <div class="rounded-md border">
      <genui-table>
        <genui-thead>
          <genui-tr>
            @for (col of columns(); track col.accessor) {
              <genui-th>{{ col.header }}</genui-th>
            }
          </genui-tr>
        </genui-thead>
        <genui-tbody>
          @for (row of tableData(); track row['id'] || $index) {
            <genui-tr>
              @for (col of columns(); track col.accessor) {
                <genui-td>{{ row[col.accessor] }}</genui-td>
              }
            </genui-tr>
          }
        </genui-tbody>
      </genui-table>
    </div>
  `
})
export class TableRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  columns = computed(() => (this.node().p?.["columns"] as { header: string; accessor: string }[]) || []);
  tableData = computed(() => (this.node().p?.["data"] as Record<string, any>[]) || []);
}

@Component({
  selector: "genui-flex-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GenUiFlex],
  template: `
    <genui-flex [gap]="flexGap" [justifyContent]="flexJustify" [alignItems]="flexAlign">
      @for (child of node().children; track child.id) {
        <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
      }
    </genui-flex>
  `
})
export class FlexRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get flexGap(): string { return str(this.node().p, "gap", "var(--genui-spacing-md)"); }
  get flexJustify(): string { return str(this.node().p, "justifyContent", "flex-start"); }
  get flexAlign(): string { return str(this.node().p, "alignItems", "stretch"); }
}

@Component({
  selector: "genui-grid-renderer",
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicRendererComponent), GenUiGrid],
  template: `
    <genui-grid [columns]="gridCols" [gap]="gridGap">
      @for (child of node().children; track child.id) {
        <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
      }
    </genui-grid>
  `
})
export class GridRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get gridCols(): number { return num(this.node().p, "columns", 1); }
  get gridGap(): string { return str(this.node().p, "gap", "var(--genui-spacing-md)"); }
}

@Component({
  selector: "genui-kpi-renderer",
  standalone: true,
  imports: [CommonModule, GenUiKpi],
  template: `
    <genui-kpi [label]="kpiLabel" [value]="kpiValue"
              [subtext]="kpiSubtext" [trend]="kpiTrend" [trendValue]="kpiTrendValue">
    </genui-kpi>
  `
})
export class KpiRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get kpiLabel(): string { return str(this.node().p, "label"); }
  get kpiValue(): string { return str(this.node().p, "value"); }
  get kpiSubtext(): string { return str(this.node().p, "subtext"); }
  get kpiTrend(): "up" | "down" | "neutral" | "" {
    const v = this.node().p?.["trend"];
    if (v === "up" || v === "down" || v === "neutral") return v;
    return "";
  }
  get kpiTrendValue(): string { return str(this.node().p, "trendValue"); }
}

@Component({
  selector: "genui-dashboard-renderer",
  standalone: true,
  imports: [CommonModule, GenUiStack, forwardRef(() => DynamicRendererComponent)],
  template: `
    <genui-stack gap="var(--genui-spacing-lg)">
      @for (child of node().children; track child.id) {
        <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
      }
    </genui-stack>
  `
})
export class DashboardRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
}

@Component({
  selector: "genui-chart-renderer",
  standalone: true,
  imports: [CommonModule, GenUiChart],
  template: `
    <div style="width:100%;">
      <genui-chart [type]="chartType" [data]="chartData" [chartHeight]="chartHeight"
                  [colorScheme]="chartColorScheme"></genui-chart>
    </div>
  `
})
export class ChartRenderer implements GenUiComponent {
  node = input.required<RuntimeNode>();
  get chartType(): string { return str(this.node().p, "type", "line"); }
  get chartData(): { label: string; value: number }[] {
    return (this.node().p?.["data"] as { label: string; value: number }[]) || [];
  }
  get chartHeight(): number { return num(this.node().p, "height", 260); }
  get chartColorScheme(): string { return str(this.node().p, "colorScheme", "default"); }
}

export const GENUI_CORE_RENDERERS = [
  PageRenderer, SectionRenderer, CardRenderer, TextRenderer, HeadingRenderer,
  ButtonRenderer, InputRenderer, TextareaRenderer, SelectRenderer, CheckboxRenderer,
  TableRenderer, FlexRenderer, GridRenderer, KpiRenderer, DashboardRenderer, ChartRenderer,
];