import { Component, Input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-separator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="computedClass()"
      role="separator"
      [attr.aria-orientation]="orientation"
    ></div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipSeparator {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() class = '';

  protected computedClass = computed(() =>
    cn(
      'shrink-0 bg-border',
      this.orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      this.class
    )
  );
}