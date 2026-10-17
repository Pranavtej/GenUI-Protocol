import { Component, Injectable, effect, inject, input, output, signal } from "@angular/core";
import { ASTDocument } from "@genui-protocol/ast";
import { AgentEvent, RuntimeSession, RuntimeTree, createSession } from "@genui-protocol/runtime-core";
import { DynamicRendererComponent } from "./dynamic-renderer.component";
import { GENUI_SESSION } from "./session";

/** Owns one RuntimeSession for the component subtree it is provided on. */
@Injectable()
export class GenUiSessionHolder {
    onEmit: ((event: AgentEvent) => void) | null = null;
    readonly session: RuntimeSession = createSession({ onEmit: (e) => this.onEmit?.(e) });
}

/**
 * Renders a document with its own session: `$bind`/`$tpl` resolve against the document's `data`, user input
 * updates it, and `emit`/`submit` actions surface through `(agentEvent)`.
 */
@Component({
    selector: "genui-session-host",
    standalone: true,
    imports: [DynamicRendererComponent],
    providers: [GenUiSessionHolder, { provide: GENUI_SESSION, useFactory: (h: GenUiSessionHolder) => h.session, deps: [GenUiSessionHolder] }],
    template: `
        @if (tree(); as t) {
            <genui-dynamic-renderer [node]="t.root"></genui-dynamic-renderer>
        }
    `
})
export class GenUiSessionHostComponent {
    document = input.required<ASTDocument>();
    agentEvent = output<AgentEvent>();

    private holder = inject(GenUiSessionHolder);
    protected tree = signal<RuntimeTree | null>(null);

    constructor() {
        this.holder.onEmit = (e) => this.agentEvent.emit(e);
        effect(() => {
            this.holder.session.load(this.document());
            this.tree.set(this.holder.session.tree);
        }, { allowSignalWrites: true });
    }
}
