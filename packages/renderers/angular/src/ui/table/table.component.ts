import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../lib/utils';

@Component({
  selector: 'genui-table',
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
export class GenUiTable {}

@Component({
  selector: 'genui-thead',
  standalone: true,
  imports: [CommonModule],
  template: `<thead class="[&_tr]:border-b"><ng-content></ng-content></thead>`,
  encapsulation: ViewEncapsulation.None,
})
export class GenUiThead {}

@Component({
  selector: 'genui-tbody',
  standalone: true,
  imports: [CommonModule],
  template: `<tbody class="[&_tr:last-child]:border-0"><ng-content></ng-content></tbody>`,
  encapsulation: ViewEncapsulation.None,
})
export class GenUiTbody {}

@Component({
  selector: 'genui-tr',
  standalone: true,
  imports: [CommonModule],
  template: `<tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><ng-content></ng-content></tr>`,
  encapsulation: ViewEncapsulation.None,
})
export class GenUiTr {}

@Component({
  selector: 'genui-th',
  standalone: true,
  imports: [CommonModule],
  template: `
    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
      <ng-content></ng-content>
    </th>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GenUiTh {}

@Component({
  selector: 'genui-td',
  standalone: true,
  imports: [CommonModule],
  template: `
    <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0">
      <ng-content></ng-content>
    </td>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class GenUiTd {}