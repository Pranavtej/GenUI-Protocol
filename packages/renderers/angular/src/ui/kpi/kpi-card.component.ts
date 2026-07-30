import { Component, input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuipBadge } from '../badge/badge.component';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-kpi',
  standalone: true,
  imports: [CommonModule, GuipBadge],
  template: `
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div class="flex flex-row items-center justify-between space-y-0 pb-2">
        <p class="text-sm font-medium text-muted-foreground">{{ label() }}</p>
        @if (trend()) {
          <guip-badge [variant]="trend() === 'up' ? 'success' : trend() === 'down' ? 'destructive' : 'secondary'">
            {{ trendValue() }}
          </guip-badge>
        }
      </div>
      <div class="text-3xl font-bold">{{ value() }}</div>
      @if (subtext()) {
        <p class="text-xs text-muted-foreground mt-1">{{ subtext() }}</p>
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipKpi {
  label = input('');
  value = input('');
  subtext = input('');
  trend = input<'up' | 'down' | 'neutral' | ''>('');
  trendValue = input('');
  class = input('');
}