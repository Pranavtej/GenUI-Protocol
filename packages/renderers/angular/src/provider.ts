import { InjectionToken, Type } from "@angular/core";

export interface GenUiComponentMapping {
    type: string;
    component: Type<any>;
}

export const GENUI_COMPONENT_MAPPINGS = new InjectionToken<GenUiComponentMapping[]>(
    "GENUI_COMPONENT_MAPPINGS"
);

export function provideGenUiComponent(type: string, component: Type<any>) {
    return {
        provide: GENUI_COMPONENT_MAPPINGS,
        useValue: { type, component },
        multi: true
    };
}
