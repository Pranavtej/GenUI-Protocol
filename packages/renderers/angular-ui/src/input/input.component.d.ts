import { ControlValueAccessor } from '@angular/forms';
export declare class GuipInput implements ControlValueAccessor {
    id: string;
    type: string;
    placeholder: string;
    label: string;
    hint: string;
    error: string;
    required: boolean;
    disabled: boolean;
    class: string;
    labelClass: string;
    value: string;
    private onChange;
    private onTouched;
    protected computedClass: import("@angular/core").Signal<string>;
    onInput(event: Event): void;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
}
export declare class GuipLabel {
    for: string;
    class: string;
    protected computedClass: import("@angular/core").Signal<string>;
}
//# sourceMappingURL=input.component.d.ts.map