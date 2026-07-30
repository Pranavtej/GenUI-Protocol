import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * GuipText: Headless text/span component
 * Behavior: Text content with semantic styling
 * Styling: CSS custom properties
 */
@Component({
  selector: 'guip-text',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="guip-text"><ng-content></ng-content></span>`,
  styles: [`
    .guip-text {
      color: var(--guip-text-primary, #fafafa);
      font-size: var(--guip-font-size-base, 14px);
      line-height: 1.5;
    }
  `]
})
export class GuipText {
  as = input<'span' | 'p' | 'div'>('span');
}

/**
 * GuipHeading: Headless heading component
 * Behavior: Semantic heading with CSS custom properties
 * Styling: CSS custom properties
 */
@Component({
  selector: 'guip-heading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 *ngIf="level() === 1" class="guip-heading"><ng-content></ng-content></h1>
    <h2 *ngIf="level() === 2" class="guip-heading"><ng-content></ng-content></h2>
    <h3 *ngIf="level() === 3" class="guip-heading"><ng-content></ng-content></h3>
    <h4 *ngIf="level() === 4" class="guip-heading"><ng-content></ng-content></h4>
    <h5 *ngIf="level() === 5" class="guip-heading"><ng-content></ng-content></h5>
    <h6 *ngIf="level() === 6" class="guip-heading"><ng-content></ng-content></h6>
  `,
  styles: [`
    .guip-heading {
      margin: 0;
      color: var(--guip-text-primary, #fafafa);
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1.guip-heading { font-size: var(--guip-font-size-xl, 28px); }
    h2.guip-heading { font-size: var(--guip-font-size-lg, 24px); }
    h3.guip-heading { font-size: var(--guip-font-size-md, 20px); }
    h4.guip-heading { font-size: var(--guip-font-size-base, 18px); }
    h5.guip-heading { font-size: var(--guip-font-size-sm, 16px); }
    h6.guip-heading { font-size: var(--guip-font-size-xs, 14px); }
  `]
})
export class GuipHeading {
  level = input<1 | 2 | 3 | 4 | 5 | 6>(3);
}
