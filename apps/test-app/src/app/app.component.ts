import { Component, OnInit, OnDestroy, effect, signal, viewChild, ViewContainerRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RuntimeTree, buildRuntimeTree } from "@ainative-ui/runtime-core";
import { eventRouter, UIEvent } from "@ainative-ui/event-engine";
import { DynamicRendererComponent } from "@ainative-ui/angular";
import { ASTDocument } from "@ainative-ui/ast";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-screen w-screen flex flex-col bg-background text-foreground">
      <header class="flex items-center justify-between px-6 h-14 bg-card border-b shrink-0">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
          <h1 class="text-lg font-bold tracking-tight">FlowAI Agent Testbed</h1>
          <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">v1.0.0</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                [class.bg-primary]="agentStatus()==='connected'"
                [class.text-primary-foreground]="agentStatus()==='connected'"
                [class.border-primary]="agentStatus()==='connected'"
                [class.bg-destructive]="agentStatus()==='error'"
                [class.text-destructive-foreground]="agentStatus()==='error'"
                [class.border-destructive]="agentStatus()==='error'"
                [class.text-muted-foreground]="agentStatus()!=='connected' && agentStatus()!=='error'">
            {{ agentStatus() }}
          </span>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border bg-transparent hover:bg-accent transition-colors"
                  (click)="toggleTheme()">
            {{ isDark() ? 'Light' : 'Dark' }}
          </button>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden">
        <div class="w-[420px] min-w-[320px] border-r flex flex-col bg-card">
          <div class="flex-1 overflow-y-auto p-4 space-y-4" #chatScroll>
            @for (msg of messages(); track $index) {
              <div class="flex gap-3"
                   [class.flex-row-reverse]="msg.role==='user'">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                     [class.bg-primary]="msg.role==='user'"
                     [class.text-primary-foreground]="msg.role==='user'"
                     [class.bg-muted]="msg.role==='agent'"
                     [class.text-muted-foreground]="msg.role==='agent'">
                  {{ msg.role === 'user' ? 'U' : 'AI' }}
                </div>
                <div class="max-w-[85%]"
                     [class.order-1]="msg.role==='user'">
                  <div class="rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                       [class.bg-primary]="msg.role==='user'"
                       [class.text-primary-foreground]="msg.role==='user'"
                       [class.bg-muted]="msg.role==='agent'"
                       [class.text-foreground]="msg.role==='agent'">
                    {{ msg.content }}
                  </div>
                  <div class="text-[10px] text-muted-foreground mt-1 px-1"
                       [class.text-right]="msg.role==='user'">
                    {{ msg.timestamp | date:'HH:mm:ss' }}
                  </div>
                </div>
              </div>
            }
            @if (isStreaming()) {
              <div class="flex gap-3">
                <div class="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-muted-foreground">AI</div>
                <div class="rounded-xl px-4 py-2.5 text-sm bg-muted text-muted-foreground">
                  <span class="inline-block animate-pulse">▊</span>
                </div>
              </div>
            }
            @if (messages().length === 0) {
              <div class="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"></path>
                  </svg>
                </div>
                <p class="text-sm font-medium">Ask about FlowAI</p>
                <p class="text-xs opacity-60 text-center max-w-[200px]">Sales data, CRM analytics, lead metrics, pricing, or request a dashboard visualization.</p>
              </div>
            }
          </div>

          <div class="p-4 border-t">
            <div class="flex gap-2">
              <input
                #chatInput
                type="text"
                [(ngModel)]="userInput"
                (keyup.enter)="sendMessage()"
                placeholder="Ask about FlowAI..."
                class="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                [disabled]="isStreaming()"
              />
              <button
                (click)="sendMessage()"
                [disabled]="isStreaming() || !userInput.trim()"
                class="inline-flex items-center justify-center rounded-xl text-sm font-medium h-10 w-10 bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
            <div class="flex gap-2 mt-2">
              @for (s of suggestedPrompts(); track s) {
                <button
                  (click)="sendSuggestion(s)"
                  [disabled]="isStreaming()"
                  class="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-4 h-10 border-b bg-card shrink-0">
            <span class="text-sm font-medium">UI Canvas</span>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              @if (runtimeTree()) {
                <span>AST rendered</span>
                <button class="hover:text-foreground transition-colors" (click)="clearAST()">Clear</button>
              }
            </div>
          </div>
          <div class="flex-1 overflow-auto p-6">
            <ng-container #astContainer></ng-container>
            @if (!runtimeTree()) {
              <div class="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9 9 0 0112.162 0M12 4v1m0 4v2m0 4v1"></path>
                </svg>
                <p class="text-sm">Ask the agent a question to generate a UI</p>
                <p class="text-xs opacity-50">Agent will create AST visualizations from your queries</p>
              </div>
            }
          </div>
        </div>

        <aside class="w-[280px] min-w-[220px] border-l flex flex-col bg-card">
          <div class="flex items-center justify-between px-4 h-10 border-b shrink-0">
            <span class="text-sm font-medium">Event Log</span>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 hover:bg-accent transition-colors"
                    (click)="clearLogs()">Clear</button>
          </div>
          <div class="flex-1 overflow-y-auto scrollbar-thin">
            <div class="p-3 space-y-2">
              @for (log of logs(); track $index) {
                <div class="p-2 rounded-md border bg-muted/30 text-xs font-mono">
                  <div class="flex items-center justify-between mb-1">
                    <span class="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold"
                          [class.bg-primary]="log.type==='click'"
                          [class.text-primary-foreground]="log.type==='click'"
                          [class.text-muted-foreground]="log.type!=='click'">
                      {{ log.type }}
                    </span>
                    <span class="text-muted-foreground">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
                  </div>
                  <div class="text-muted-foreground">ID: {{ log.target }}</div>
                  @if (log.payload) {
                    <pre class="mt-1 text-primary">{{ serialize(log.payload) }}</pre>
                  }
                </div>
              } @empty {
                <p class="text-center text-xs text-muted-foreground py-8">No events yet</p>
              }
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 2px; }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  isDark = signal(true);
  agentStatus = signal<"connected" | "disconnected" | "error" | "streaming">("disconnected");
  runtimeTree = signal<RuntimeTree | null>(null);
  logs = signal<UIEvent[]>([]);
  messages = signal<ChatMessage[]>([]);
  userInput = "";
  isStreaming = signal(false);
  suggestedPrompts = signal([
    "Show Q2 sales performance",
    "Lead conversion rates",
    "What are the pricing plans?",
    "Create a sales dashboard",
    "Top performing teams Q2",
  ]);

  private astContainer = viewChild.required<string, ViewContainerRef>("astContainer", { read: ViewContainerRef });
  private agentBaseUrl = "http://localhost:8000";
  private abortController: AbortController | null = null;
  private astComponentRef: any = null;

  constructor() {
    effect(() => {
      if (this.isDark()) {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }
    });

    eventRouter.subscribeGlobal((ev: UIEvent) => {
      this.logs.update((current) => [ev, ...current]);
    });
  }

  toggleTheme() { this.isDark.update(v => !v); }
  clearLogs() { this.logs.set([]); }

  ngOnInit(): void { this.checkHealth(); }
  ngOnDestroy(): void { this.abortController?.abort(); }

  private async checkHealth() {
    try {
      const resp = await fetch(`${this.agentBaseUrl}/health`);
      if (resp.ok) {
        this.agentStatus.set("connected");
      } else {
        this.agentStatus.set("error");
      }
    } catch {
      this.agentStatus.set("error");
    }
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  clearAST() {
    this.runtimeTree.set(null);
    this.astComponentRef = null;
  }

  async sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isStreaming()) return;
    this.userInput = "";

    this.messages.update(m => [...m, { role: "user", content: text, timestamp: new Date() }]);
    this.agentStatus.set("streaming");
    this.isStreaming.set(true);

    this.abortController = new AbortController();
    const accumulatedText = signal("");

    try {
      const resp = await fetch(`${this.agentBaseUrl}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, thread_id: "default" }),
        signal: this.abortController.signal,
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const raw = trimmed.slice(6);

          try {
            const event = JSON.parse(raw);
            if (event.type === "done") break;

            switch (event.type) {
              case "text":
                accumulatedText.update(prev => prev + event.content);
                this.messages.update(m => {
                  const copy = [...m];
                  const last = copy[copy.length - 1];
                  if (last?.role === "agent") {
                    copy[copy.length - 1] = { ...last, content: accumulatedText() };
                  } else {
                    copy.push({ role: "agent", content: accumulatedText(), timestamp: new Date() });
                  }
                  return copy;
                });
                break;

              case "ast":
                if (event.content) {
                  const astDoc: ASTDocument = {
                    version: "1.0.0",
                    root: event.content?.root || event.content,
                  };
                  const tree = buildRuntimeTree(astDoc);
                  this.runtimeTree.set(tree);
                  this.renderAST(tree);
                }
                break;

              case "tool_call":
                this.logs.update(l => [...l, {
                  type: "tool_call",
                  target: event.name || "",
                  payload: event.args,
                  timestamp: Date.now(),
                } as any]);
                break;

              case "tool_result":
                this.logs.update(l => [...l, {
                  type: "tool_result",
                  target: event.name || "",
                  payload: event.content,
                  timestamp: Date.now(),
                } as any]);
                break;
            }
          } catch { continue; }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        this.messages.update(m => [...m, {
          role: "agent",
          content: `Error: ${err.message || "Connection failed"}`,
          timestamp: new Date(),
        }]);
      }
    } finally {
      this.isStreaming.set(false);
      this.agentStatus.set("connected");
      this.abortController = null;
    }
  }

  private renderAST(tree: RuntimeTree) {
    try {
      const container = this.astContainer();
      container.clear();
      const ref = container.createComponent(DynamicRendererComponent);
      ref.setInput("node", tree.root);
      this.astComponentRef = ref;
    } catch (e) {
      console.error("Failed to render AST:", e);
    }
  }

  serialize(val: any) { return JSON.stringify(val); }
}
