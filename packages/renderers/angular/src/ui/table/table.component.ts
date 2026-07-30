import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'guip-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full overflow-auto">
      <table class="w-full caption-bottom text-sm">
        <ng-content></ng-content>
      </table>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTable {}

@Component({
  selector: 'guip-thead',
  standalone: true,
  imports: [CommonModule],
  template: `<thead class="[&_tr]:border-b"><ng-content></ng-content></thead>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipThead {}

@Component({
  selector: 'guip-tbody',
  standalone: true,
  imports: [CommonModule],
  template: `<tbody class="[&_tr:last-child]:border-0"><ng-content></ng-content></tbody>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTbody {}

@Component({
  selector: 'guip-tr',
  standalone: true,
  imports: [CommonModule],
  template: `<tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><ng-content></ng-content></tr>`,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTr {}

@Component({
  selector: 'guip-th',
  standalone: true,
  imports: [CommonModule],
  template: `
    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
      <ng-content></ng-content>
    </th>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTh {}

@Component({
  selector: 'guip-td',
  standalone: true,
  imports: [CommonModule],
  template: `
    <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0">
      <ng-content></ng-content>
    </td>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GuipTd {}