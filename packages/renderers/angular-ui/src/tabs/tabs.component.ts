import { Component, Input, Output, EventEmitter, ViewEncapsulation, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <div class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        @for (tab of tabs; track tab.value) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="activeTab() === tab.value"
            [class]="tabClass(tab.value)"
            (click)="selectTab(tab.value)"
          >
            @if (tab.icon) {
              <span class="mr-2 h-4 w-4 inline-block">{{ tab.icon }}</span>
            }
            {{ tab.label }}
          </button>
        }
      </div>
      <div class="mt-2">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTabs {
  @Input() tabs: { label: string; value: string; icon?: string }[] = [];
  @Input() active = '';
  @Output() onTabChange = new EventEmitter<string>();

  protected activeTab = computed(() => this.active);

  selectTab(value: string): void {
    this.onTabChange.emit(value);
  }

  tabClass(value: string): string {
    return cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      value === this.activeTab()
        ? 'bg-background text-foreground shadow-sm'
        : 'hover:text-foreground'
    );
  }
}

@Component({
  selector: 'guip-tab-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (active) {
      <div role="tabpanel" class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <ng-content></ng-content>
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTabPanel {
  @Input() active = false;
}