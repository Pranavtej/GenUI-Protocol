import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-scroll-area',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative overflow-hidden" [class]="scrollClass">
      <div
        class="h-full w-full overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
        [style.maxHeight]="maxHeight"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipScrollArea {
  @Input() maxHeight = '';
  @Input() class = '';

  get scrollClass(): string {
    return cn('w-full', this.class);
  }
}