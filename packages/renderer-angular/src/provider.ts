import { InjectionToken, Type } from "@angular/core";

export interface GuipComponentMapping {
    type: string;
    component: Type<any>;
}

export const GUIP_COMPONENT_MAPPINGS = new InjectionToken<GuipComponentMapping[]>(
    "GUIP_COMPONENT_MAPPINGS"
);

export function provideGuipComponent(type: string, component: Type<any>) {
    return {
        provide: GUIP_COMPONENT_MAPPINGS,
        useValue: { type, component },
        multi: true
    };
}
