import { Component, input, model, forwardRef, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="id()" class="text-sm font-medium leading-none mb-1 block">{{ label() }}</label>
      }
      <textarea
        [id]="id()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [value]="value"
        [class]="computedClass()"
        [attr.aria-invalid]="error() ? 'true' : 'false'"
        [attr.aria-describedby]="error() ? id() + '-error' : null"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [rows]="rows()"
      ></textarea>
      @if (error()) {
        <p id="{{ id() }}-error" class="text-sm text-destructive mt-1" role="alert">{{ error() }}</p>
      }
      @if (hint() && !error()) {
        <p id="{{ id() }}-hint" class="text-sm text-muted-foreground mt-1">{{ hint() }}</p>
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GuipTextarea),
      multi: true,
    },
  ],
})
export class GuipTextarea implements ControlValueAccessor {
  id = input(`textarea-${Math.random().toString(36).substr(2, 9)}`);
  placeholder = input('');
  label = input('');
  hint = input('');
  error = input('');
  required = input(false);
  disabled = model(false);
  rows = input(3);
  class = input('');
  labelClass = input('');

  value = '';
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected computedClass = computed(() =>
    cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
      this.error() && 'border-destructive focus-visible:ring-destructive',
      this.class()
    )
  );

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
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
    this.disabled.set(isDisabled);
  }
}