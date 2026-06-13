import { Component, Input, Output, EventEmitter, forwardRef, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="inline-flex items-center gap-2 cursor-pointer" [class.opacity-50]="disabled">
      <button
        [id]="id"
        type="button"
        role="switch"
        [attr.aria-checked]="checked"
        [disabled]="disabled"
        [class]="trackClass()"
        (click)="toggle()"
        (keydown.space)="$event.preventDefault(); toggle()"
      >
        <span [class]="thumbClass()">
          <span class="sr-only">{{ label }}</span>
        </span>
      </button>
      @if (label) {
        <span class="text-sm font-medium leading-none">{{ label }}</span>
      }
      <ng-content></ng-content>
    </label>
  `,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GuipSwitch),
      multi: true,
    },
  ],
})
export class GuipSwitch implements ControlValueAccessor {
  @Input() id = `switch-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label = '';
  @Input() disabled = false;

  checked = false;
  private onChangeFn: (checked: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected trackClass = computed(() =>
    cn(
      'peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      this.checked ? 'bg-primary' : 'bg-input'
    )
  );

  protected thumbClass = computed(() =>
    cn(
      'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
      this.checked ? 'translate-x-5' : 'translate-x-0'
    )
  );

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChangeFn(this.checked);
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