import { Component, Input, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

const COLOR_SCHEMES: Record<string, { line: string; fill: string; bar: string }> = {
  emerald: { line: '#10b981', fill: 'rgba(16,185,129,0.2)', bar: '#10b981' },
  blue: { line: '#3b82f6', fill: 'rgba(59,130,246,0.2)', bar: '#3b82f6' },
  violet: { line: '#8b5cf6', fill: 'rgba(139,92,246,0.2)', bar: '#8b5cf6' },
  amber: { line: '#f59e0b', fill: 'rgba(245,158,11,0.2)', bar: '#f59e0b' },
  rose: { line: '#f43f5e', fill: 'rgba(244,63,94,0.2)', bar: '#f43f5e' },
  cyan: { line: '#06b6d4', fill: 'rgba(6,182,212,0.2)', bar: '#06b6d4' },
  default: { line: '#6366f1', fill: 'rgba(99,102,241,0.2)', bar: '#6366f1' },
};

@Component({
  selector: 'guip-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas [style.width]="'100%'" [style.height.px]="chartHeight"></canvas>`
})
export class GuipChart implements AfterViewInit {
  @Input() type: string = 'line';
  @Input() data: { label: string; value: number }[] = [];
  @Input() chartHeight: number = 260;
  @Input() colorScheme: string = 'default';

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.draw();
  }

  draw() {
    const canvas = this.canvas.nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const w = rect.width || 400;
    const h = this.chartHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    if (!this.data || this.data.length === 0) return;

    const colors = COLOR_SCHEMES[this.colorScheme] || COLOR_SCHEMES.default;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const values = this.data.map(d => d.value);
    const maxVal = Math.max(...values, 1);
    const step = chartW / (this.data.length - 1 || 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Labels (Y axis)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = maxVal - (maxVal / 4) * i;
      ctx.fillText(formatValue(val), padding.left - 8, y + 4);
    }

    // X axis labels
    ctx.textAlign = 'center';
    this.data.forEach((d, i) => {
      const x = this.type === 'bar'
        ? padding.left + (chartW / this.data.length) * i + (chartW / this.data.length) / 2
        : padding.left + step * i;
      ctx.fillText(d.label, x, h - padding.bottom + 18);
    });

    if (this.type === 'bar') {
      this.drawBarChart(ctx, padding, chartW, chartH, maxVal, colors);
    } else {
      this.drawLineChart(ctx, padding, chartW, chartH, maxVal, step, colors);
    }
  }

  private drawLineChart(ctx: CanvasRenderingContext2D, padding: { left: number; top: number; bottom: number; right: number }, chartW: number, chartH: number, maxVal: number, step: number, colors: { line: string; fill: string }) {
    const points = this.data.map((d, i) => ({
      x: padding.left + step * i,
      y: padding.top + chartH - (d.value / maxVal) * chartH,
    }));

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = colors.fill;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors.line;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  private drawBarChart(ctx: CanvasRenderingContext2D, padding: { left: number; top: number; bottom: number; right: number }, chartW: number, chartH: number, maxVal: number, colors: { bar: string }) {
    const barWidth = Math.max(8, (chartW / this.data.length) * 0.6);
    const gap = (chartW / this.data.length) * 0.4;

    this.data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH;
      const x = padding.left + (chartW / this.data.length) * i + gap / 2;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = colors.bar;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
      ctx.fill();
    });
  }
}

function formatValue(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}
