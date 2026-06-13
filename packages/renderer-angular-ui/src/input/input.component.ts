import { Component, Input, Output, EventEmitter, forwardRef, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="id" class="text-sm font-medium leading-none mb-1 block">{{ label }}</label>
      }
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [value]="value"
        [class]="computedClass()"
        [attr.aria-invalid]="error ? 'true' : 'false'"
        [attr.aria-describedby]="error ? id + '-error' : null"
        (input)="onInput($event)"
        (change)="onNativeChange($event)"
        (blur)="onTouched()"
      />
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
      useExisting: forwardRef(() => GuipInput),
      multi: true,
    },
  ],
})
export class GuipInput implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() class = '';
  @Input() labelClass = '';
  @Output('input') inputChange = new EventEmitter<string>();
  @Output('change') valueChange = new EventEmitter<string>();

  value = '';
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected computedClass = computed(() =>
    cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      this.error && 'border-destructive focus-visible:ring-destructive',
      this.class
    )
  );

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onNativeChange(event: Event): void {
    this.valueChange.emit(this.value);
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

@Component({
  selector: 'guip-label',
  standalone: true,
  imports: [CommonModule],
  template: `<label [for]="for" [class]="computedClass()"><ng-content></ng-content></label>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipLabel {
  @Input() for = '';
  @Input() class = '';

  protected computedClass = computed(() =>
    cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', this.class)
  );
}