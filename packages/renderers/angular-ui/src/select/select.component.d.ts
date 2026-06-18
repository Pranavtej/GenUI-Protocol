import { AfterContentInit } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export declare class GuipSelect implements ControlValueAccessor, AfterContentInit {
    id: string;
    placeholder: string;
    label: string;
    hint: string;
    error: string;
    required: boolean;
    disabled: boolean;
    class: string;
    labelClass: string;
    options: {
        label: string;
        value: string;
    }[];
    value: string;
    private onChangeFn;
    private onTouchedFn;
    protected computedClass: import("@angular/core").Signal<string>;
    ngAfterContentInit(): void;
    onChange(event: Event): void;
    onTouched(): void;
    writeValue(value: string): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
}
export declare class GuipSelectOption {
    value: string;
}
//# sourceMappingURL=select.component.d.ts.map