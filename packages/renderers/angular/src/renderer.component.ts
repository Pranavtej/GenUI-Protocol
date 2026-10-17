import { Component, input, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { marked } from "marked";
import { buildRuntimeTree, RuntimeTree } from "@genui-protocol/runtime-core";
import { DynamicRendererComponent } from "./dynamic-renderer.component";

interface MarkdownSegment {
  type: "markdown";
  html: SafeHtml;
}

interface AstSegment {
  type: "ast";
  tree: RuntimeTree;
}

type Segment = MarkdownSegment | AstSegment;

@Component({
  selector: "genui-renderer",
  standalone: true,
  imports: [CommonModule, DynamicRendererComponent],
  template: `
    @for (segment of segments(); track $index) {
      @if (segment.type === "markdown") {
        <div class="genui-markdown" [innerHTML]="segment.html"></div>
      } @else {
        <genui-dynamic-renderer [node]="segment.tree.root"></genui-dynamic-renderer>
      }
    }
  `,
  styles: [`
    .genui-markdown p { margin: 0 0 0.5rem 0; }
    .genui-markdown p:last-child { margin-bottom: 0; }
    .genui-markdown ul, .genui-markdown ol { margin: 0.25rem 0; padding-left: 1.5rem; }
    .genui-markdown pre {
      background: rgba(0,0,0,0.1); border-radius: 4px;
      padding: 0.75rem; overflow-x: auto; margin: 0.5rem 0;
    }
    .genui-markdown code { font-size: 0.875em; }
    .genui-markdown img { max-width: 100%; border-radius: 4px; }
    .genui-markdown a { color: hsl(var(--primary)); text-decoration: underline; }
    .genui-markdown blockquote {
      border-left: 3px solid hsl(var(--border));
      margin: 0.5rem 0; padding-left: 1rem;
      color: hsl(var(--muted-foreground));
    }
    .genui-markdown table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    .genui-markdown th, .genui-markdown td {
      border: 1px solid hsl(var(--border));
      padding: 0.375rem 0.75rem; text-align: left;
    }
    .genui-markdown h1, .genui-markdown h2, .genui-markdown h3, .genui-markdown h4 {
      margin: 0.75rem 0 0.5rem;
    }
  `]
})
export class GenUiRendererComponent {
  text = input.required<string>();
  private sanitizer = inject(DomSanitizer);

  protected segments = computed(() => {
    const raw = this.text();
    if (!raw) return [];

    const segments: Segment[] = [];
    const astBlockRegex = /```ast\s*\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = astBlockRegex.exec(raw)) !== null) {
      const mdPart = raw.slice(lastIndex, match.index);
      if (mdPart.trim()) {
        const html = marked.parse(mdPart, { async: false }) as string;
        segments.push({ type: "markdown", html: this.sanitizer.bypassSecurityTrustHtml(html) });
      }

      const astJson = match[1].trim();
      if (astJson) {
        try {
          const doc = JSON.parse(astJson);
          const tree = buildRuntimeTree(doc);
          segments.push({ type: "ast", tree });
        } catch {
          const html = marked.parse("```\n" + astJson + "\n```", { async: false }) as string;
          segments.push({ type: "markdown", html: this.sanitizer.bypassSecurityTrustHtml(html) });
        }
      }

      lastIndex = match.index + match[0].length;
    }

    const remaining = raw.slice(lastIndex);
    if (remaining.trim()) {
      const html = marked.parse(remaining, { async: false }) as string;
      segments.push({ type: "markdown", html: this.sanitizer.bypassSecurityTrustHtml(html) });
    }

    return segments;
  });
}
