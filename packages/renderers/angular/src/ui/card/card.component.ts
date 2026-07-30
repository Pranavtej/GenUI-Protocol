import { Component, input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass()">
      @if (hasHeader()) {
        <div class="flex flex-col space-y-1.5 p-6">
          @if (title()) {
            <h3 class="text-2xl font-semibold leading-none tracking-tight">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="text-sm text-muted-foreground">{{ subtitle() }}</p>
          }
        </div>
      }
      <div class="p-6 pt-0">
        <ng-content></ng-content>
      </div>
      @if (hasFooter()) {
        <div class="flex items-center p-6 pt-0">
          <ng-content select="[guip-card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipCard {
  title = input('');
  subtitle = input('');
  class = input('');

  protected hasHeader = computed(() => !!this.title() || !!this.subtitle());
  protected hasFooter = computed(() => false);

  protected computedClass = computed(() =>
    cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      this.class()
    )
  );
}

@Component({
  selector: 'guip-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col space-y-1.5 p-6">
      <ng-content></ng-content>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipCardHeader {}

@Component({
  selector: 'guip-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `<h3 class="text-2xl font-semibold leading-none tracking-tight"><ng-content></ng-content></h3>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipCardTitle {}

@Component({
  selector: 'guip-card-description',
  standalone: true,
  imports: [CommonModule],
  template: `<p class="text-sm text-muted-foreground"><ng-content></ng-content></p>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipCardDescription {}

@Component({
  selector: 'guip-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-6 pt-0"><ng-content></ng-content></div>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipCardContent {}

@Component({
  selector: 'guip-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="flex items-center p-6 pt-0"><ng-content></ng-content></div>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipCardFooter {}