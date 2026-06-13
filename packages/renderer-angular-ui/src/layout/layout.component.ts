import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * GuipFlex: Headless flexbox layout component
 * Behavior: Flex container with configurable direction/alignment
 * Styling: CSS custom properties and inline styles
 */
@Component({
  selector: 'guip-flex',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="guip-flex" [style.gap]="gap" [style.justifyContent]="justifyContent" [style.alignItems]="alignItems">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .guip-flex {
      display: flex;
      flex-direction: row;
    }
  `]
})
export class GuipFlex {
  @Input() gap: string = 'var(--guip-spacing-md, 16px)';
  @Input() justifyContent: string = 'flex-start';
  @Input() alignItems: string = 'stretch';
  @Input() wrap: boolean = false;
}

/**
 * GuipStack: Headless vertical stack (flex column)
 * Behavior: Vertical flex container
 * Styling: CSS custom properties
 */
@Component({
  selector: 'guip-stack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="guip-stack" [style.gap]="gap">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .guip-stack {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class GuipStack {
  @Input() gap: string = 'var(--guip-spacing-md, 16px)';
}

/**
 * GuipGrid: Headless grid layout component
 * Behavior: CSS Grid container
 * Styling: Configurable columns
 */
@Component({
  selector: 'guip-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="guip-grid" [style.gridTemplateColumns]="templateColumns" [style.gap]="gap">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .guip-grid {
      display: grid;
    }
  `]
})
export class GuipGrid {
  @Input() columns: number = 1;
  @Input() gap: string = 'var(--guip-spacing-md, 16px)';

  get templateColumns(): string {
    return `repeat(${this.columns}, 1fr)`;
  }
}
