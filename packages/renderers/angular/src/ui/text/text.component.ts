import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * GenUiText: Headless text/span component
 * Behavior: Text content with semantic styling
 * Styling: CSS custom properties
 */
@Component({
  selector: 'genui-text',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="genui-text"><ng-content></ng-content></span>`,
  styles: [`
    .genui-text {
      color: var(--genui-text-primary, #fafafa);
      font-size: var(--genui-font-size-base, 14px);
      line-height: 1.5;
    }
  `]
})
export class GenUiText {
  as = input<'span' | 'p' | 'div'>('span');
}

/**
 * GenUiHeading: Headless heading component
 * Behavior: Semantic heading with CSS custom properties
 * Styling: CSS custom properties
 */
@Component({
  selector: 'genui-heading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 *ngIf="level() === 1" class="genui-heading"><ng-content></ng-content></h1>
    <h2 *ngIf="level() === 2" class="genui-heading"><ng-content></ng-content></h2>
    <h3 *ngIf="level() === 3" class="genui-heading"><ng-content></ng-content></h3>
    <h4 *ngIf="level() === 4" class="genui-heading"><ng-content></ng-content></h4>
    <h5 *ngIf="level() === 5" class="genui-heading"><ng-content></ng-content></h5>
    <h6 *ngIf="level() === 6" class="genui-heading"><ng-content></ng-content></h6>
  `,
  styles: [`
    .genui-heading {
      margin: 0;
      color: var(--genui-text-primary, #fafafa);
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1.genui-heading { font-size: var(--genui-font-size-xl, 28px); }
    h2.genui-heading { font-size: var(--genui-font-size-lg, 24px); }
    h3.genui-heading { font-size: var(--genui-font-size-md, 20px); }
    h4.genui-heading { font-size: var(--genui-font-size-base, 18px); }
    h5.genui-heading { font-size: var(--genui-font-size-sm, 16px); }
    h6.genui-heading { font-size: var(--genui-font-size-xs, 14px); }
  `]
})
export class GenUiHeading {
  level = input<1 | 2 | 3 | 4 | 5 | 6>(3);
}
