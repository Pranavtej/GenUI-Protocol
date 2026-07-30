import { ControlValueAccessor } from '@angular/forms';
export declare class GuipCheckbox implements ControlValueAccessor {
    id: string;
    label: string;
    required: boolean;
    disabled: boolean;
    color: string;
    checked: boolean;
    private onChangeFn;
    private onTouchedFn;
    onCheckboxChange(event: Event): void;
    onTouched(): void;
    writeValue(value: boolean): void;
    registerOnChange(fn: (checked: boolean) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
}
//# sourceMappingURL=checkbox.component.d.ts.map