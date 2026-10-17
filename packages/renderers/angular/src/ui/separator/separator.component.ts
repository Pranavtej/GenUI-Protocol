import { Component, input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'genui-separator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="computedClass()"
      role="separator"
      [attr.aria-orientation]="orientation()"
    ></div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GenUiSeparator {
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  class = input('');

  protected computedClass = computed(() =>
    cn(
      'shrink-0 bg-border',
      this.orientation() === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      this.class()
    )
  );
}