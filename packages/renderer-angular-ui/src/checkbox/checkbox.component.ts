import { Component, Input, Output, EventEmitter, forwardRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-checkbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="flex items-center gap-2 cursor-pointer group" [class.opacity-50]="disabled">
      <div class="relative flex items-center justify-center">
        <input
          [id]="id"
          type="checkbox"
          [checked]="checked"
          [disabled]="disabled"
          [required]="required"
          [class]="checkboxClass"
          (change)="onCheckboxChange($event)"
          (blur)="onTouched()"
        />
        @if (checked) {
          <svg class="absolute h-3 w-3 text-primary-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        }
      </div>
      @if (label) {
        <span class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          {{ label }}
        </span>
      }
      <ng-content></ng-content>
    </label>
  `,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GuipCheckbox),
      multi: true,
    },
  ],
})
export class GuipCheckbox implements ControlValueAccessor {
  @Input() id = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() color = '';
  @Output('change') checkChange = new EventEmitter<boolean>();

  checked = false;
  private onChangeFn: (checked: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  get checkboxClass(): string {
    return cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      this.checked ? 'bg-primary border-primary' : 'bg-background',
      this.color && 'bg-' + this.color
    );
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChangeFn(this.checked);
    this.checkChange.emit(this.checked);
  }

  onTouched(): void {
    this.onTouchedFn();
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (checked: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}