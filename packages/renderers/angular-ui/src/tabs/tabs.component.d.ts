import { EventEmitter } from '@angular/core';
export declare class GuipTabs {
    tabs: {
        label: string;
        value: string;
        icon?: string;
    }[];
    active: string;
    onTabChange: EventEmitter<string>;
    protected activeTab: import("@angular/core").Signal<string>;
    selectTab(value: string): void;
    tabClass(value: string): string;
}
export declare class GuipTabPanel {
    active: boolean;
}
//# sourceMappingURL=tabs.component.d.ts.map