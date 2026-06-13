import { EventEmitter, signal } from '@angular/core';
export declare class GuipDialog {
    open: ReturnType<typeof signal<boolean>>;
    title: string;
    subtitle: string;
    showClose: boolean;
    disableBackdrop: boolean;
    class: string;
    onOpenChange: EventEmitter<boolean>;
    private uid;
    protected titleId: import("@angular/core").Signal<string>;
    protected contentClass: import("@angular/core").Signal<string>;
    openDialog(): void;
    closeDialog(): void;
}
//# sourceMappingURL=dialog.component.d.ts.map