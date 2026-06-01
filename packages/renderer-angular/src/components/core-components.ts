import { Component, Input, inject, signal, computed, forwardRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeNode } from "@ainative-ui/runtime-core";
import { eventRouter } from "@ainative-ui/event-engine";
import { DynamicRendererComponent } from "../dynamic-renderer.component";

// Standard Component base type for type-safety
export interface GuipComponent {
    node: RuntimeNode;
}

// 1. PAGE RENDERER
@Component({
    selector: "guip-page",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <header class="mb-8 border-b border-slate-800 pb-6">
                <h1 class="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                    {{ node.p?.["title"] }}
                </h1>
                @if (node.p?.["subtitle"]) {
                    <p class="text-slate-400 mt-2 text-lg">{{ node.p?.["subtitle"] }}</p>
                }
            </header>
            <main class="space-y-6">
                @for (child of node.children; track child.id) {
                    <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                }
            </main>
        </div>
    `
})
export class PageRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;
}

// 2. SECTION RENDERER
@Component({
    selector: "guip-section",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <section class="p-6 rounded-2xl bg-slate-900/50 backdrop-blur-md border"
                 [ngClass]="borderClass()">
            @if (node.p?.["title"]) {
                <div class="mb-4">
                    <h2 class="text-2xl font-bold text-slate-100">{{ node.p?.["title"] }}</h2>
                    @if (node.p?.["description"]) {
                        <p class="text-slate-400 text-sm mt-1">{{ node.p?.["description"] }}</p>
                    }
                </div>
            }
            <div class="space-y-4">
                @for (child of node.children; track child.id) {
                    <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                }
            </div>
        </section>
    `
})
export class SectionRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    borderClass() {
        return this.node.p?.["border"] !== false ? "border-slate-800" : "border-transparent";
    }
}

// 3. CARD RENDERER (Spartan Card style)
@Component({
    selector: "guip-card",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="rounded-xl border bg-slate-900 text-slate-100 shadow-md transition-all duration-300 hover:border-slate-700"
             [ngClass]="borderedClass()">
            @if (node.p?.["title"] || node.p?.["subtitle"]) {
                <div class="flex flex-col space-y-1.5 p-6 border-b border-slate-800/50">
                    <h3 class="text-xl font-semibold leading-none tracking-tight">{{ node.p?.["title"] }}</h3>
                    @if (node.p?.["subtitle"]) {
                        <p class="text-sm text-slate-400">{{ node.p?.["subtitle"] }}</p>
                    }
                </div>
            }
            <div class="p-6 pt-4 space-y-4">
                @for (child of node.children; track child.id) {
                    <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                }
            </div>
        </div>
    `
})
export class CardRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    borderedClass() {
        return this.node.p?.["bordered"] !== false ? "border-slate-800" : "border-transparent";
    }
}

// 4. TEXT RENDERER
@Component({
    selector: "guip-text",
    standalone: true,
    imports: [CommonModule],
    template: `
        <p class="transition-colors duration-200" [ngClass]="[sizeClass(), colorClass(), boldClass()]">
            {{ node.p?.["content"] }}
        </p>
    `
})
export class TextRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    sizeClass() {
        const size = String(this.node.p?.["size"] || "base");
        const map: Record<string, string> = {
            xs: "text-xs",
            sm: "text-sm",
            base: "text-base",
            lg: "text-lg",
            xl: "text-xl"
        };
        return map[size] || "text-base";
    }

    colorClass() {
        const color = String(this.node.p?.["color"] || "default");
        const map: Record<string, string> = {
            default: "text-slate-200",
            muted: "text-slate-400",
            primary: "text-violet-400",
            success: "text-emerald-400",
            warning: "text-amber-400",
            danger: "text-rose-400"
        };
        return map[color] || "text-slate-200";
    }

    boldClass() {
        return this.node.p?.["bold"] ? "font-bold" : "font-normal";
    }
}

// 5. HEADING RENDERER
@Component({
    selector: "guip-heading",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div [ngSwitch]="headingLevel()" class="font-extrabold tracking-tight">
            <h1 *ngSwitchCase="1" class="text-4xl text-slate-100 mb-4">{{ node.p?.["text"] }}</h1>
            <h2 *ngSwitchCase="2" class="text-3xl text-slate-100 mb-3">{{ node.p?.["text"] }}</h2>
            <h3 *ngSwitchCase="3" class="text-2xl text-slate-200 mb-2">{{ node.p?.["text"] }}</h3>
            <h4 *ngSwitchCase="4" class="text-xl text-slate-200 mb-2">{{ node.p?.["text"] }}</h4>
            <h5 *ngSwitchCase="5" class="text-lg text-slate-300 mb-1">{{ node.p?.["text"] }}</h5>
            <h6 *ngSwitchCase="6" class="text-base text-slate-300 mb-1">{{ node.p?.["text"] }}</h6>
            <h2 *ngSwitchDefault class="text-3xl text-slate-100 mb-3">{{ node.p?.["text"] }}</h2>
        </div>
    `
})
export class HeadingRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    headingLevel(): number {
        return Number(this.node.p?.["level"] || 2);
    }
}

// 6. BUTTON RENDERER (Spartan Button style)
@Component({
    selector: "guip-button",
    standalone: true,
    imports: [CommonModule],
    template: `
        <button [disabled]="node.p?.['disabled'] === true"
                (click)="onClick()"
                class="inline-flex items-center justify-center rounded-md font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-slate-100 border border-transparent"
                [ngClass]="[variantClass(), sizeClass()]">
            {{ node.p?.["label"] }}
        </button>
    `
})
export class ButtonRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    onClick() {
        eventRouter.dispatch({
            type: "click",
            target: this.node.id,
            payload: { label: this.node.p?.["label"] }
        });
    }

    variantClass() {
        const variant = String(this.node.p?.["variant"] || "default");
        const map: Record<string, string> = {
            default: "bg-violet-600 hover:bg-violet-700 text-white shadow shadow-violet-900/30",
            outline: "border border-slate-700 hover:bg-slate-800 text-slate-200",
            secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100",
            ghost: "hover:bg-slate-800 text-slate-300 hover:text-slate-100",
            destructive: "bg-rose-600 hover:bg-rose-700 text-white shadow shadow-rose-900/30"
        };
        return map[variant] || map["default"];
    }

    sizeClass() {
        const size = String(this.node.p?.["size"] || "default");
        const map: Record<string, string> = {
            sm: "h-9 px-3 text-xs",
            default: "h-10 px-4 py-2 text-sm",
            lg: "h-11 px-8 text-base"
        };
        return map[size] || map["default"];
    }
}

// 7. INPUT RENDERER
@Component({
    selector: "guip-input",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="flex flex-col space-y-1.5 w-full">
            @if (node.p?.["label"]) {
                <label class="text-sm font-medium text-slate-400">{{ node.p?.["label"] }}</label>
            }
            <input [type]="node.p?.['type'] || 'text'"
                   [placeholder]="node.p?.['placeholder'] || ''"
                   [disabled]="node.p?.['disabled'] === true"
                   [(ngModel)]="value"
                   (input)="onInput()"
                   (change)="onChange()"
                   class="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50 text-slate-100" />
        </div>
    `
})
export class InputRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    get value(): string {
        return String(this.node.p?.["value"] ?? "");
    }
    set value(val: string) {
        if (!this.node.p) this.node.p = {};
        this.node.p["value"] = val;
    }

    onInput() {
        eventRouter.dispatch({
            type: "input",
            target: this.node.id,
            payload: { value: this.value }
        });
    }

    onChange() {
        eventRouter.dispatch({
            type: "change",
            target: this.node.id,
            payload: { value: this.value }
        });
    }
}

// 8. TEXTAREA RENDERER
@Component({
    selector: "guip-textarea",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="flex flex-col space-y-1.5 w-full">
            @if (node.p?.["label"]) {
                <label class="text-sm font-medium text-slate-400">{{ node.p?.["label"] }}</label>
            }
            <textarea [placeholder]="node.p?.['placeholder'] || ''"
                      [disabled]="node.p?.['disabled'] === true"
                      [rows]="node.p?.['rows'] || 3"
                      [(ngModel)]="value"
                      (change)="onChange()"
                      class="flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50 text-slate-100"></textarea>
        </div>
    `
})
export class TextareaRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    get value(): string {
        return String(this.node.p?.["value"] ?? "");
    }
    set value(val: string) {
        if (!this.node.p) this.node.p = {};
        this.node.p["value"] = val;
    }

    onChange() {
        eventRouter.dispatch({
            type: "change",
            target: this.node.id,
            payload: { value: this.value }
        });
    }
}

// 9. SELECT RENDERER
@Component({
    selector: "guip-select",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="flex flex-col space-y-1.5 w-full">
            @if (node.p?.["label"]) {
                <label class="text-sm font-medium text-slate-400">{{ node.p?.["label"] }}</label>
            }
            <select [(ngModel)]="value"
                    [disabled]="node.p?.['disabled'] === true"
                    (change)="onChange()"
                    class="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 text-slate-100 cursor-pointer">
                @for (opt of options(); track opt.value) {
                    <option [value]="opt.value" class="bg-slate-950">{{ opt.label }}</option>
                }
            </select>
        </div>
    `
})
export class SelectRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    options = computed(() => {
        return (this.node.p?.["options"] as { label: string; value: string }[]) || [];
    });

    get value(): string {
        return String(this.node.p?.["value"] ?? "");
    }
    set value(val: string) {
        if (!this.node.p) this.node.p = {};
        this.node.p["value"] = val;
    }

    onChange() {
        eventRouter.dispatch({
            type: "change",
            target: this.node.id,
            payload: { value: this.value }
        });
    }
}

// 10. CHECKBOX RENDERER
@Component({
    selector: "guip-checkbox",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="flex items-center space-x-2.5">
            <input type="checkbox"
                   [id]="node.id"
                   [(ngModel)]="checked"
                   [disabled]="node.p?.['disabled'] === true"
                   (change)="onChange()"
                   class="h-5 w-5 rounded border border-slate-800 bg-slate-950 checked:bg-violet-600 focus:ring-slate-700 cursor-pointer" />
            <label [for]="node.id" class="text-sm font-medium text-slate-300 cursor-pointer select-none">
                {{ node.p?.["label"] }}
            </label>
        </div>
    `
})
export class CheckboxRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    get checked(): boolean {
        return !!this.node.p?.["checked"];
    }
    set checked(val: boolean) {
        if (!this.node.p) this.node.p = {};
        this.node.p["checked"] = val;
    }

    onChange() {
        eventRouter.dispatch({
            type: "change",
            target: this.node.id,
            payload: { checked: this.checked }
        });
    }
}

// 11. TABLE RENDERER
@Component({
    selector: "guip-table",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="w-full overflow-auto rounded-lg border border-slate-800 bg-slate-900/30">
            <table class="w-full caption-bottom text-sm">
                <thead class="border-b border-slate-800 bg-slate-900/60 font-semibold text-slate-300">
                    <tr class="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        @for (col of columns(); track col.accessor) {
                            <th class="h-12 px-4 text-left align-middle font-bold">{{ col.header }}</th>
                        }
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/50 text-slate-200">
                    @for (row of tableData(); track $index) {
                        <tr class="transition-colors hover:bg-slate-800/40">
                            @for (col of columns(); track col.accessor) {
                                <td class="p-4 align-middle font-medium">{{ row[col.accessor] }}</td>
                            }
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    `
})
export class TableRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    columns = computed(() => {
        return (this.node.p?.["columns"] as { header: string; accessor: string }[]) || [];
    });

    tableData = computed(() => {
        return (this.node.p?.["data"] as Record<string, any>[]) || [];
    });
}

// 12. CHART RENDERER (SVG-based line, bar, pie)
@Component({
    selector: "guip-chart",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-6 rounded-xl border border-slate-800 bg-slate-950/40 shadow-inner flex flex-col space-y-4">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {{ type() }} representation
                </span>
                <div class="flex space-x-2">
                    <span class="w-2.5 h-2.5 rounded-full" [ngClass]="colorSchemeDot()"></span>
                    <span class="text-xs text-slate-400 capitalize">{{ colorScheme() }} theme</span>
                </div>
            </div>

            <div class="relative w-full" [style.height.px]="height()">
                @if (type() === 'bar') {
                    <svg class="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" stroke-dasharray="4" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" stroke-dasharray="4" />
                        <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" stroke-dasharray="4" />

                        @for (bar of barRects(); track $index) {
                            <g class="group">
                                <rect [attr.x]="bar.x"
                                      [attr.y]="bar.y"
                                      [attr.width]="bar.w"
                                      [attr.height]="bar.h"
                                      [attr.fill]="colorSchemeFill()"
                                      rx="3"
                                      class="transition-all duration-300 hover:opacity-80" />
                                <text [attr.x]="bar.x + bar.w/2"
                                      [attr.y]="195"
                                      fill="#64748b"
                                      font-size="8"
                                      text-anchor="middle">
                                    {{ bar.label }}
                                </text>
                                <text [attr.x]="bar.x + bar.w/2"
                                      [attr.y]="bar.y - 6"
                                      fill="#94a3b8"
                                      font-size="8"
                                      font-weight="bold"
                                      text-anchor="middle"
                                      class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {{ bar.val }}
                                </text>
                            </g>
                        }
                    </svg>
                } @else if (type() === 'line') {
                    <svg class="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" stroke-dasharray="4" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" stroke-dasharray="4" />
                        <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" stroke-dasharray="4" />

                        <path [attr.d]="linePathArea()" [attr.fill]="'url(#' + gradientId() + ')'" />
                        
                        <defs>
                            <linearGradient [id]="gradientId()" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" [attr.stop-color]="colorSchemeFill()" stop-opacity="0.3"/>
                                <stop offset="100%" [attr.stop-color]="colorSchemeFill()" stop-opacity="0"/>
                            </linearGradient>
                        </defs>

                        <path [attr.d]="linePath()" fill="none" [attr.stroke]="colorSchemeFill()" stroke-width="2.5" />

                        @for (dot of lineDots(); track $index) {
                            <g class="group">
                                <circle [attr.cx]="dot.x"
                                        [attr.cy]="dot.y"
                                        r="4.5"
                                        [attr.fill]="colorSchemeFill()"
                                        stroke="#0f172a"
                                        stroke-width="1.5"
                                        class="cursor-pointer transition-transform hover:scale-150" />
                                <text [attr.x]="dot.x"
                                      [attr.y]="dot.y - 10"
                                      fill="#f8fafc"
                                      font-size="8"
                                      font-weight="bold"
                                      text-anchor="middle"
                                      class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900">
                                    {{ dot.val }}
                                </text>
                                <text [attr.x]="dot.x"
                                      [attr.y]="195"
                                      fill="#64748b"
                                      font-size="8"
                                      text-anchor="middle">
                                    {{ dot.label }}
                                </text>
                            </g>
                        }
                    </svg>
                } @else {
                    <div class="flex items-center justify-center h-full">
                        <svg class="w-48 h-48" viewBox="0 0 100 100">
                            @for (arc of pieArcs(); track $index) {
                                <path [attr.d]="arc.path"
                                      [attr.fill]="arc.color"
                                      class="transition-transform duration-300 hover:scale-105"
                                      [style.transform-origin]="'50% 50%'" />
                            }
                        </svg>
                        <div class="ml-6 space-y-1.5 flex flex-col justify-center">
                            @for (arc of pieArcs(); track $index) {
                                <div class="flex items-center space-x-2 text-xs">
                                    <span class="w-3 h-3 rounded-sm" [style.background-color]="arc.color"></span>
                                    <span class="text-slate-300 font-semibold">{{ arc.label }} ({{ arc.val }})</span>
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    `
})
export class ChartRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    protected gradientId = signal(`grad_${Math.random().toString(36).substr(2, 6)}`);

    type() { return String(this.node.p?.["type"] || "bar"); }
    height() { return Number(this.node.p?.["height"] || 200); }
    colorScheme() { return String(this.node.p?.["colorScheme"] || "default"); }

    colorSchemeDot() {
        const cs = this.colorScheme();
        if (cs === "emerald") return "bg-emerald-500";
        if (cs === "rose") return "bg-rose-500";
        if (cs === "amber") return "bg-amber-500";
        return "bg-violet-500";
    }

    colorSchemeFill() {
        const cs = this.colorScheme();
        if (cs === "emerald") return "#10b981";
        if (cs === "rose") return "#f43f5e";
        if (cs === "amber") return "#f59e0b";
        return "#8b5cf6";
    }

    chartData = computed(() => {
        return (this.node.p?.["data"] as { label: string; value: number }[]) || [];
    });

    barRects = computed(() => {
        const data = this.chartData();
        if (data.length === 0) return [];
        const maxVal = Math.max(...data.map((d) => d.value)) || 1;
        const totalBars = data.length;
        const barSpacing = 400 / totalBars;
        const w = Math.max(10, barSpacing - 20);

        return data.map((d, index) => {
            const h = (d.value / maxVal) * 140;
            const x = 50 + index * barSpacing;
            const y = 170 - h;
            return { x, y, w, h, val: d.value, label: d.label };
        });
    });

    lineDots = computed(() => {
        const data = this.chartData();
        if (data.length === 0) return [];
        const maxVal = Math.max(...data.map((d) => d.value)) || 1;
        const widthStep = 400 / (data.length - 1 || 1);

        return data.map((d, index) => {
            const x = 50 + index * widthStep;
            const y = 170 - (d.value / maxVal) * 130;
            return { x, y, val: d.value, label: d.label };
        });
    });

    linePath = computed(() => {
        const dots = this.lineDots();
        if (dots.length === 0) return "";
        return dots.map((d, i) => `${i === 0 ? "M" : "L"} ${d.x} ${d.y}`).join(" ");
    });

    linePathArea = computed(() => {
        const dots = this.lineDots();
        if (dots.length === 0) return "";
        const baseLine = this.linePath();
        return `${baseLine} L ${dots[dots.length - 1].x} 170 L ${dots[0].x} 170 Z`;
    });

    pieArcs = computed(() => {
        const data = this.chartData();
        const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
        
        let cumulativeAngle = 0;
        const colorPalette = ["#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#a855f7"];

        return data.map((d, i) => {
            const percentage = d.value / total;
            const angle = percentage * 360;
            
            const x1 = 50 + 40 * Math.cos((cumulativeAngle - 90) * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin((cumulativeAngle - 90) * Math.PI / 180);
            
            cumulativeAngle += angle;

            const x2 = 50 + 40 * Math.cos((cumulativeAngle - 90) * Math.PI / 180);
            const y2 = 50 + 40 * Math.sin((cumulativeAngle - 90) * Math.PI / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;
            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            const color = colorPalette[i % colorPalette.length];

            return { path, color, label: d.label, val: d.value };
        });
    });
}

// 13. TABS RENDERER
@Component({
    selector: "guip-tabs",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="w-full flex flex-col space-y-4">
            <div class="flex items-center space-x-1 p-1 bg-slate-900 rounded-lg max-w-max border border-slate-800">
                @for (item of items(); track item.value) {
                    <button (click)="selectTab(item.value)"
                            class="px-4 py-2 text-sm rounded-md font-semibold transition-all duration-200 cursor-pointer"
                            [ngClass]="activeTab() === item.value ? 'bg-slate-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'">
                        {{ item.label }}
                    </button>
                }
            </div>
            
            <div class="p-6 rounded-lg border border-slate-800 bg-slate-900/20">
                @for (child of node.children; track child.id) {
                    <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                }
            </div>
        </div>
    `
})
export class TabsRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    items = computed(() => {
        return (this.node.p?.["items"] as { label: string; value: string }[]) || [];
    });

    activeTab() {
        return String(this.node.p?.["activeTab"] || this.items()[0]?.value || "");
    }

    selectTab(val: string) {
        if (!this.node.p) this.node.p = {};
        this.node.p["activeTab"] = val;
        
        eventRouter.dispatch({
            type: "tabChange",
            target: this.node.id,
            payload: { activeTab: val }
        });
    }
}

// 14. DIALOG RENDERER
@Component({
    selector: "guip-dialog",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        @if (isOpen()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
                <div class="relative w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <button (click)="close()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    
                    <div class="mb-4">
                        <h3 class="text-xl font-bold leading-none tracking-tight">{{ node.p?.["title"] }}</h3>
                        @if (node.p?.["description"]) {
                            <p class="text-sm text-slate-400 mt-1">{{ node.p?.["description"] }}</p>
                        }
                    </div>

                    <div class="space-y-4 my-6">
                        @for (child of node.children; track child.id) {
                            <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                        }
                    </div>

                    <div class="flex items-center justify-end space-x-2">
                        <button (click)="close()" class="h-10 px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        }
    `
})
export class DialogRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    isOpen() {
        return !!this.node.p?.["open"];
    }

    close() {
        if (!this.node.p) this.node.p = {};
        this.node.p["open"] = false;
        
        eventRouter.dispatch({
            type: "close",
            target: this.node.id,
            payload: { open: false }
        });
    }
}

// 15. DRAWER RENDERER
@Component({
    selector: "guip-drawer",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        @if (isOpen()) {
            <div class="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm"
                 [ngClass]="position() === 'left' ? 'justify-start' : 'justify-end'">
                <div class="h-full w-full max-w-md border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl flex flex-col justify-between"
                     [ngClass]="[
                        position() === 'left' ? 'border-r animate-in slide-in-from-left duration-250' : 'border-l animate-in slide-in-from-right duration-250'
                     ]">
                    <div>
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-bold leading-none tracking-tight">{{ node.p?.["title"] }}</h3>
                            <button (click)="close()" class="text-slate-400 hover:text-slate-200 cursor-pointer">
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div class="space-y-4">
                            @for (child of node.children; track child.id) {
                                <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                            }
                        </div>
                    </div>

                    <button (click)="close()" class="w-full h-10 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer">
                        Close Drawer
                    </button>
                </div>
            </div>
        }
    `
})
export class DrawerRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    isOpen() {
        return !!this.node.p?.["open"];
    }

    position() {
        return String(this.node.p?.["position"] || "right");
    }

    close() {
        if (!this.node.p) this.node.p = {};
        this.node.p["open"] = false;
        
        eventRouter.dispatch({
            type: "close",
            target: this.node.id,
            payload: { open: false }
        });
    }
}

// 16. GRID RENDERER
@Component({
    selector: "guip-grid",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="grid w-full" [ngClass]="[colsClass(), gapClass()]">
            @for (child of node.children; track child.id) {
                <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
            }
        </div>
    `
})
export class GridRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    colsClass() {
        const cols = Number(this.node.p?.["cols"] || 3);
        const map: Record<number, string> = {
            1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4",
            5: "grid-cols-5", 6: "grid-cols-6", 7: "grid-cols-7", 8: "grid-cols-8",
            9: "grid-cols-9", 10: "grid-cols-10", 11: "grid-cols-11", 12: "grid-cols-12"
        };
        return map[cols] || "grid-cols-3";
    }

    gapClass() {
        const gap = Number(this.node.p?.["gap"] || 4);
        const map: Record<number, string> = {
            0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8"
        };
        return map[gap] || "gap-4";
    }
}

// 17. FLEX RENDERER
@Component({
    selector: "guip-flex",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="flex w-full" [ngClass]="[directionClass(), alignClass(), justifyClass(), gapClass()]">
            @for (child of node.children; track child.id) {
                <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
            }
        </div>
    `
})
export class FlexRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    directionClass() {
        return this.node.p?.["direction"] === "col" ? "flex-col" : "flex-row";
    }

    alignClass() {
        const align = String(this.node.p?.["align"] || "start");
        const map: Record<string, string> = {
            start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch"
        };
        return map[align] || "items-start";
    }

    justifyClass() {
        const justify = String(this.node.p?.["justify"] || "start");
        const map: Record<string, string> = {
            start: "justify-start", center: "justify-center", between: "justify-between", end: "justify-end"
        };
        return map[justify] || "justify-start";
    }

    gapClass() {
        const gap = Number(this.node.p?.["gap"] || 4);
        const map: Record<number, string> = {
            0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8"
        };
        return map[gap] || "gap-4";
    }
}

// 18. STACK RENDERER
@Component({
    selector: "guip-stack",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="flex w-full" [ngClass]="[directionClass(), gapClass()]">
            @for (child of node.children; track child.id) {
                <div class="w-full">
                    <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                </div>
            }
        </div>
    `
})
export class StackRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    directionClass() {
        return this.node.p?.["direction"] === "horizontal" ? "flex-row" : "flex-col";
    }

    gapClass() {
        const gap = Number(this.node.p?.["gap"] || 4);
        const map: Record<number, string> = {
            0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8"
        };
        return map[gap] || "gap-4";
    }
}

// 19. KPI RENDERER
@Component({
    selector: "guip-kpi",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow shadow-slate-950 flex flex-col justify-between h-32 transition-transform hover:scale-[1.01]">
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>{{ node.p?.["label"] }}</span>
                @if (trend()) {
                    <span [ngClass]="[trendColorClass(), 'px-1.5 py-0.5 rounded text-[10px] font-bold']">
                        {{ trendValue() }}
                    </span>
                }
            </div>
            
            <div class="flex items-baseline space-x-2">
                <span class="text-3xl font-extrabold tracking-tight text-slate-100">
                    {{ node.p?.["value"] }}
                </span>
            </div>

            @if (node.p?.["subtext"]) {
                <p class="text-xs text-slate-400 mt-1">{{ node.p?.["subtext"] }}</p>
            }
        </div>
    `
})
export class KpiRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    trend() { return this.node.p?.["trend"]; }
    trendValue() { return this.node.p?.["trendValue"] || ""; }

    trendColorClass() {
        const t = this.trend();
        if (t === "up") return "bg-emerald-500/10 text-emerald-400";
        if (t === "down") return "bg-rose-500/10 text-rose-400";
        return "bg-slate-800 text-slate-300";
    }
}

// 20. DASHBOARD RENDERER
@Component({
    selector: "guip-dashboard",
    standalone: true,
    imports: [CommonModule, forwardRef(() => DynamicRendererComponent)],
    template: `
        <div class="space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800/50">
                <div>
                    <h1 class="text-3xl font-extrabold tracking-tight text-slate-100">
                        {{ node.p?.["title"] }}
                    </h1>
                </div>
            </div>
            
            <div [ngClass]="layoutClass()">
                @for (child of node.children; track child.id) {
                    <guip-dynamic-renderer [node]="child"></guip-dynamic-renderer>
                }
            </div>
        </div>
    `
})
export class DashboardRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    layoutClass() {
        return this.node.p?.["layout"] === "flex" ? "flex flex-col space-y-6" : "grid grid-cols-1 md:grid-cols-3 gap-6";
    }
}

// 21. WORKFLOW RENDERER
@Component({
    selector: "guip-workflow",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex flex-col space-y-4 p-6 rounded-xl border border-slate-800 bg-slate-900/30">
            <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Workflow Pipeline</h4>
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                @for (step of steps(); track step.id; let idx = $index) {
                    <div class="flex items-center space-x-3 flex-1 relative">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300"
                             [ngClass]="stepColors(step.status)">
                            @if (step.status === 'completed') {
                                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                            } @else if (step.status === 'failed') {
                                <span class="text-rose-400">!</span>
                            } @else if (step.status === 'active') {
                                <span class="relative flex h-3 w-3">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                                </span>
                            } @else {
                                <span class="text-slate-500">{{ idx + 1 }}</span>
                            }
                        </div>

                        <div class="flex flex-col">
                            <span class="text-sm font-semibold text-slate-100">{{ step.name }}</span>
                            <span class="text-xs text-slate-400 capitalize">
                                {{ step.status }} @if (step.duration) { ({{ step.duration }}) }
                            </span>
                        </div>

                        @if (idx < steps().length - 1) {
                            <div class="hidden md:block absolute top-5 left-12 w-full h-[2px] bg-slate-800 z-[-1]"
                                 [ngClass]="step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-800'"></div>
                        }
                    </div>
                }
            </div>
        </div>
    `
})
export class WorkflowRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    steps() {
        return (this.node.p?.["steps"] as any[]) || [];
    }

    stepColors(status: string) {
        if (status === "completed") return "border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow shadow-emerald-900/10";
        if (status === "active") return "border-violet-500 bg-violet-950/20 text-violet-400 animate-pulse";
        if (status === "failed") return "border-rose-500 bg-rose-950/20 text-rose-400";
        return "border-slate-800 bg-slate-900 text-slate-500";
    }
}

// 22. TIMELINE RENDERER
@Component({
    selector: "guip-timeline",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-6 rounded-xl border border-slate-800 bg-slate-900/20 w-full">
            <div class="flow-root">
                <ul role="list" class="-mb-8">
                    @for (item of items(); track $index; let last = $last) {
                        <li>
                            <div class="relative pb-8">
                                @if (!last) {
                                    <span class="absolute top-4 left-4 -ml-px h-full w-[2px] bg-slate-800" aria-hidden="true"></span>
                                }
                                <div class="relative flex space-x-3">
                                    <div>
                                        <span class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-950"
                                              [ngClass]="statusBg(item.status)">
                                            <span class="h-2 w-2 rounded-full" [ngClass]="statusDot(item.status)"></span>
                                        </span>
                                    </div>
                                    <div class="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p class="text-sm font-semibold text-slate-100">{{ item.title }}</p>
                                            @if (item.description) {
                                                <p class="text-xs text-slate-400 mt-1">{{ item.description }}</p>
                                            }
                                        </div>
                                        <div class="text-right text-xs whitespace-nowrap text-slate-500">
                                            <time>{{ item.date }}</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    }
                </ul>
            </div>
        </div>
    `
})
export class TimelineRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    items() {
        return (this.node.p?.["items"] as any[]) || [];
    }

    statusBg(status?: string) {
        if (status === "completed") return "bg-emerald-950";
        if (status === "current") return "bg-violet-950";
        return "bg-slate-800";
    }

    statusDot(status?: string) {
        if (status === "completed") return "bg-emerald-500";
        if (status === "current") return "bg-violet-500";
        return "bg-slate-500";
    }
}

// 23. EXECUTION GRAPH RENDERER
@Component({
    selector: "guip-execution-graph",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-6 rounded-xl border border-slate-800 bg-slate-950/20 flex flex-col space-y-6 w-full overflow-auto">
            <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Agent Reason Process-Graph</h4>
            
            <div class="relative min-h-[160px] flex items-center justify-center p-4">
                <svg class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 1;">
                    @for (edge of edges(); track $index) {
                        <path [attr.d]="computeCurve(edge.source, edge.target)"
                              fill="none"
                              [attr.stroke]="isEdgeActive(edge) ? '#8b5cf6' : '#334155'"
                              [attr.stroke-width]="isEdgeActive(edge) ? 2.5 : 1.5"
                              [attr.stroke-dasharray]="edge.animated ? '5,5' : 'none'"
                              [attr.class]="edge.animated ? 'animate-dash' : ''" />
                    }
                </svg>

                <style>
                    @keyframes dash {
                        to {
                            stroke-dashoffset: -20;
                        }
                    }
                    .animate-dash {
                        animation: dash 1.5s linear infinite;
                    }
                </style>

                <div class="flex flex-row justify-between w-full max-w-2xl relative z-10 px-4">
                    @for (item of nodesList(); track item.id) {
                        <div [id]="'node_' + item.id"
                             class="flex flex-col items-center p-4 rounded-lg border bg-slate-900 text-center shadow-lg transition-transform hover:scale-105 w-36"
                             [ngClass]="nodeBorder(item.status)">
                            
                            <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                                 [ngClass]="nodeBg(item.status)">
                                @if (item.status === 'success') {
                                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path></svg>
                                } @else if (item.status === 'error') {
                                    <span class="text-xs font-bold text-rose-400">X</span>
                                } @else if (item.status === 'running') {
                                    <span class="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping"></span>
                                } @else {
                                    <span class="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                                }
                            </div>
                            
                            <span class="text-xs font-semibold text-slate-100 truncate w-full">{{ item.label }}</span>
                            <span class="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">{{ item.type }}</span>
                        </div>
                    }
                </div>
            </div>
        </div>
    `
})
export class ExecutionGraphRenderer implements GuipComponent {
    @Input({ required: true }) node!: RuntimeNode;

    nodesList() {
        return (this.node.p?.["nodes"] as any[]) || [];
    }

    edges() {
        return (this.node.p?.["edges"] as any[]) || [];
    }

    nodeBorder(status: string) {
        if (status === "success") return "border-emerald-900/60 hover:border-emerald-600";
        if (status === "running") return "border-violet-900 hover:border-violet-500";
        if (status === "error") return "border-rose-900/60 hover:border-rose-600";
        return "border-slate-800 hover:border-slate-700";
    }

    nodeBg(status: string) {
        if (status === "success") return "bg-emerald-950/40 text-emerald-400";
        if (status === "running") return "bg-violet-950/40 text-violet-400";
        if (status === "error") return "bg-rose-950/40 text-rose-400";
        return "bg-slate-950/40 text-slate-600";
    }

    isEdgeActive(edge: any) {
        const sourceNode = this.nodesList().find((n) => n.id === edge.source);
        return sourceNode && (sourceNode.status === "success" || sourceNode.status === "running");
    }

    computeCurve(source: string, target: string): string {
        const sourceIdx = this.nodesList().findIndex((n) => n.id === source);
        const targetIdx = this.nodesList().findIndex((n) => n.id === target);
        
        if (sourceIdx === -1 || targetIdx === -1) return "";

        const width = 640;
        const totalNodes = this.nodesList().length || 1;
        const colSpacing = width / totalNodes;

        const x1 = 50 + sourceIdx * colSpacing + 72;
        const y1 = 90;
        const x2 = 50 + targetIdx * colSpacing + 72;
        const y2 = 90;

        const cpX1 = x1 + (x2 - x1) / 2;
        const cpY1 = y1;
        const cpX2 = x1 + (x2 - x1) / 2;
        const cpY2 = y2;

        return `M ${x1} ${y1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x2} ${y2}`;
    }
}
