import { Component, Type, inject, computed, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RuntimeNode } from "@genui-protocol/runtime-core";
import { GENUI_COMPONENT_MAPPINGS } from "./provider";
import { GENUI_SESSION, sessionVersion, withResolvedProps } from "./session";

@Component({
    selector: "genui-dynamic-renderer",
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (resolvedComponent()) {
            <ng-container *ngComponentOutlet="resolvedComponent()!; inputs: componentInputs()"></ng-container>
        } @else {
            <div class="p-4 border border-dashed border-red-500 rounded bg-red-50/10 text-red-500 text-sm" [attr.data-genui-unknown]="node().t">
                Unknown component type: <strong>{{ node().t }}</strong>
                @for (child of node().children; track child.id) {
                    <genui-dynamic-renderer [node]="child"></genui-dynamic-renderer>
                }
            </div>
        }
    `
})
export class DynamicRendererComponent {
    node = input.required<RuntimeNode>();

    private mappings = inject(GENUI_COMPONENT_MAPPINGS, { optional: true }) || [];
    private session = inject(GENUI_SESSION, { optional: true });
    private version = this.session ? sessionVersion(this.session) : null;

    protected resolvedComponent = computed<Type<any> | null>(() => {
        const activeNode = this.node();
        if (!activeNode) return null;
        const match = this.mappings.find((m) => m.type === activeNode.t);
        return match ? match.component : null;
    });

    /** With a session, props are resolved (`$bind`/`$tpl`) against the current data before the component sees them. */
    protected componentInputs = computed(() => {
        const node = this.node();
        if (!this.session) return { node };
        this.version?.(); // re-resolve whenever the data (or tree) changes
        return { node: withResolvedProps(node, this.session.resolveProps(node)) };
    });
}
