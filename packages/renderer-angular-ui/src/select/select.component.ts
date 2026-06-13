import { Component, Input, Output, EventEmitter, forwardRef, computed, ViewEncapsulation, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="id" class="text-sm font-medium leading-none mb-1 block">{{ label }}</label>
      }
      <div class="relative">
        <select
          [id]="id"
          [disabled]="disabled"
          [required]="required"
          [value]="value"
          [class]="computedClass()"
          [attr.aria-invalid]="error ? 'true' : 'false'"
          [attr.aria-describedby]="error ? id + '-error' : null"
        (change)="onSelectChange($event)"
        (blur)="onTouched()"
        >
          @if (placeholder) {
            <option [value]="" disabled selected hidden>{{ placeholder }}</option>
          }
          @for (option of options; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
          <ng-content></ng-content>
        </select>
        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      @if (error) {
        <p id="{{ id }}-error" class="text-sm text-destructive mt-1" role="alert">{{ error }}</p>
      }
      @if (hint && !error) {
        <p id="{{ id }}-hint" class="text-sm text-muted-foreground mt-1">{{ hint }}</p>
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GuipSelect),
      multi: true,
    },
  ],
})
export class GuipSelect implements ControlValueAccessor, AfterContentInit {
  @Input() id = `select-${Math.random().toString(36).substr(2, 9)}`;
  @Input() placeholder = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() class = '';
  @Input() labelClass = '';
  @Input() options: { label: string; value: string }[] = [];
  @Output('change') selectChange = new EventEmitter<string>();

  value = '';
  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  protected computedClass = computed(() =>
    cn(
      'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10',
      this.error && 'border-destructive focus-visible:ring-destructive',
      this.class
    )
  );

  ngAfterContentInit() {}

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFn(this.value);
    this.selectChange.emit(this.value);
  }

  onTouched(): void {
    this.onTouchedFn();
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

@Component({
  selector: 'guip-select-option',
  standalone: true,
  imports: [CommonModule],
  template: `<option [value]="value"><ng-content></ng-content></option>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipSelectOption {
  @Input() value = '';
}