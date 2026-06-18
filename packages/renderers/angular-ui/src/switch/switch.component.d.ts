import { ControlValueAccessor } from '@angular/forms';
export declare class GuipSwitch implements ControlValueAccessor {
    id: string;
    label: string;
    disabled: boolean;
    checked: boolean;
    private onChangeFn;
    private onTouchedFn;
    protected trackClass: import("@angular/core").Signal<string>;
    protected thumbClass: import("@angular/core").Signal<string>;
    toggle(): void;
    writeValue(value: boolean): void;
    registerOnChange(fn: (checked: boolean) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
}
//# sourceMappingURL=switch.component.d.ts.map