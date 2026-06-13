import { Component, Input, Output, EventEmitter, ViewEncapsulation, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div
          class="fixed inset-0 bg-background/80 backdrop-blur-sm"
          (click)="!disableBackdrop && onOpenChange.emit(false)"
          (keydown.escape)="!disableBackdrop && onOpenChange.emit(false)"
        ></div>
        <div
          [class]="contentClass()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId()"
        >
          @if (title || subtitle) {
            <div class="flex flex-col space-y-1.5 text-center sm:text-left">
              @if (title) {
                <h2 [id]="titleId()" class="text-lg font-semibold leading-none tracking-tight">
                  {{ title }}
                </h2>
              }
              @if (subtitle) {
                <p class="text-sm text-muted-foreground">{{ subtitle }}</p>
              }
            </div>
          }
          <div class="mt-4">
            <ng-content></ng-content>
          </div>
          @if (showClose) {
            <button
              class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              (click)="onOpenChange.emit(false)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span class="sr-only">Close</span>
            </button>
          }
        </div>
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipDialog {
  @Input({ required: true }) open: ReturnType<typeof signal<boolean>> = signal(false);
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showClose = true;
  @Input() disableBackdrop = false;
  @Input() class = '';
  @Output() onOpenChange = new EventEmitter<boolean>();

  private uid = `dialog-${Math.random().toString(36).substr(2, 9)}`;
  protected titleId = computed(() => `${this.uid}-title`);

  protected contentClass = computed(() =>
    cn(
      'relative z-50 grid w-full gap-4 border bg-background p-6 shadow-lg sm:rounded-lg sm:max-w-lg',
      this.class
    )
  );

  openDialog(): void {
    this.onOpenChange.emit(true);
  }

  closeDialog(): void {
    this.onOpenChange.emit(false);
  }
}