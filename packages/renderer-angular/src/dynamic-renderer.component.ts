import { Component, Input, OnInit, OnChanges, SimpleChanges, Type, inject, computed, signal, viewChild, ViewContainerRef } from "@angular/core";
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
                Unknown component type: <strong>{{ node.t }}</strong>
            </div>
        }
    `
})
export class DynamicRendererComponent implements OnChanges {
    @Input({ required: true }) node!: RuntimeNode;

    private mappings = inject(GUIP_COMPONENT_MAPPINGS, { optional: true }) || [];
    
    // We wrap node in a signal for reactive updates
    protected nodeSignal = signal<RuntimeNode | null>(null);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["node"]) {
            this.nodeSignal.set(this.node);
        }
    }

    protected resolvedComponent = computed<Type<any> | null>(() => {
        const activeNode = this.nodeSignal();
        if (!activeNode) return null;
        
        const match = this.mappings.find((m) => m.type === activeNode.t);
        return match ? match.component : null;
    });

    protected componentInputs = computed(() => {
        const activeNode = this.nodeSignal();
        return {
            node: activeNode
        };
    });
}
