import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * GenUiFlex: Headless flexbox layout component
 * Behavior: Flex container with configurable direction/alignment
 * Styling: CSS custom properties and inline styles
 */
@Component({
  selector: 'genui-flex',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="genui-flex" [style.gap]="gap()" [style.justifyContent]="justifyContent()" [style.alignItems]="alignItems()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .genui-flex {
      display: flex;
      flex-direction: row;
    }
  `]
})
export class GenUiFlex {
  gap = input('var(--genui-spacing-md, 16px)');
  justifyContent = input('flex-start');
  alignItems = input('stretch');
  wrap = input(false);
}

/**
 * GenUiStack: Headless vertical stack (flex column)
 * Behavior: Vertical flex container
 * Styling: CSS custom properties
 */
@Component({
  selector: 'genui-stack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="genui-stack" [style.gap]="gap()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .genui-stack {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class GenUiStack {
  gap = input('var(--genui-spacing-md, 16px)');
}

/**
 * GenUiGrid: Headless grid layout component
 * Behavior: CSS Grid container
 * Styling: Configurable columns
 */
@Component({
  selector: 'genui-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="genui-grid" [style.gridTemplateColumns]="templateColumns" [style.gap]="gap()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .genui-grid {
      display: grid;
    }
  `]
})
export class GenUiGrid {
  columns = input(1);
  gap = input('var(--genui-spacing-md, 16px)');

  get templateColumns(): string {
    return `repeat(${this.columns()}, 1fr)`;
  }
}
