import { Component, Type, inject, computed, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RuntimeNode } from "@ainative-ui/runtime-core";
import { GUIP_COMPONENT_MAPPINGS, GuipComponentMapping } from "./provider";

@Component({
    selector: "guip-dynamic-renderer",
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (resolvedComponent()) {
            <ng-container *ngComponentOutlet="resolvedComponent()!; inputs: componentInputs()"></ng-container>
        } @else {
            <div class="p-4 border border-dashed border-red-500 rounded bg-red-50/10 text-red-500 text-sm">
                Unknown component type: <strong>{{ node().t }}</strong>
            </div>
        }
    `
})
export class DynamicRendererComponent {
    node = input.required<RuntimeNode>();

    private mappings = inject(GUIP_COMPONENT_MAPPINGS, { optional: true }) || [];

    protected resolvedComponent = computed<Type<any> | null>(() => {
        const activeNode = this.node();
        if (!activeNode) return null;
        const match = this.mappings.find((m) => m.type === activeNode.t);
        return match ? match.component : null;
    });

    protected componentInputs = computed(() => {
        return { node: this.node() };
    });
}
