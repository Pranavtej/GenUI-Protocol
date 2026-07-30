import { Component, input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-emerald-500 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

@Component({
  selector: 'guip-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span [class]="computedClass()"><ng-content></ng-content></span>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipBadge {
  variant = input<string>('default');
  class = input('');

  protected computedClass = computed(() => cn(badgeVariants({ variant: this.variant() as any }), this.class()));
}