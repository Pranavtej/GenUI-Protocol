import { ControlValueAccessor } from '@angular/forms';
export declare class GuipTextarea implements ControlValueAccessor {
    id: string;
    placeholder: string;
    label: string;
    hint: string;
    error: string;
    required: boolean;
    disabled: boolean;
    rows: number;
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
//# sourceMappingURL=textarea.component.d.ts.map