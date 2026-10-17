import type { ASTDocument } from "@genui-protocol/ast";
import { buildSystemPrompt } from "@genui-protocol/prompt-kit";
import { validateDocument } from "@genui-protocol/validation";
import { TASKS, checkFeatures, countNodes, type Task } from "./tasks.js";
import { htmlSize } from "./html.js";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ModelReply = { text: string; inputTokens?: number; outputTokens?: number };
/** Anything that turns a conversation into a reply. Providers live in models.ts; tests pass fakes. */
export type Model = (system: string, messages: ChatMessage[]) => Promise<ModelReply>;

export type TaskResult = {
    id: string;
    /** Valid and feature-complete on the first reply. */
    firstTry: boolean;
    /** Valid and feature-complete after at most `maxRepairs` repair rounds. */
    success: boolean;
    repairs: number;
    failure?: string;
    nodes?: number;
    documentChars?: number;
    htmlChars?: number;
    outputTokens: number;
};

export type Summary = {
    tasks: number;
    firstTryRate: number;
    successRate: number;
    /** Share of tasks that needed at least one repair and ended valid. */
    repairedRate: number;
    meanRepairs: number;
    totalOutputTokens: number;
    /** Median of (rendered HTML chars / document chars) across successful tasks; >1 means the document is smaller. */
    medianHtmlToDocumentRatio: number | null;
};

export type EvalReport = { model: string; maxRepairs: number; results: TaskResult[]; summary: Summary };

const FENCE = /```(?:json|ast)?\s*\n([\s\S]*?)\n```/g;

/** Pulls the first JSON object that looks like a document out of a model reply. */
export const extractDocument = (text: string): { doc?: ASTDocument; error?: string } => {
    const candidates = [...text.matchAll(FENCE)].map((m) => m[1]);
    candidates.push(text.trim());
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) candidates.push(text.slice(start, end + 1));
    let lastError = "no JSON found in the reply";
    const hasBrace = text.includes("{");
    for (const c of candidates) {
        try {
            const value = JSON.parse(c);
            if (value && typeof value === "object") {
                if ("root" in value && "version" in value) return { doc: value as ASTDocument };
                if (typeof (value as { t?: unknown }).t === "string") return { doc: { version: "1.0.0", root: value } as ASTDocument };
                lastError = 'JSON found but it is not a document (expected { "version", "root" })';
            }
        } catch (e) {
            if (hasBrace) lastError = `invalid JSON: ${(e as Error).message}`;
        }
    }
    return { error: lastError };
};

const repairMessage = (errors: string[]) =>
    `That UI document has problems. Fix every one and reply with the corrected document only:\n${errors.slice(0, 20).map((e) => `- ${e}`).join("\n")}`;

export const runTask = async (task: Task, model: Model, system: string, maxRepairs: number): Promise<TaskResult> => {
    const messages: ChatMessage[] = [{ role: "user", content: task.prompt }];
    let outputTokens = 0;
    let lastFailure = "";

    for (let attempt = 0; attempt <= maxRepairs; attempt++) {
        const reply = await model(system, messages);
        outputTokens += reply.outputTokens ?? Math.ceil(reply.text.length / 4);
        messages.push({ role: "assistant", content: reply.text });

        const { doc, error } = extractDocument(reply.text);
        const problems = doc ? (() => { const v = validateDocument(doc); return v.valid ? checkFeatures(task, doc) : v.errors ?? ["invalid"]; })() : [error ?? "no document"];

        if (problems.length === 0 && doc) {
            return { id: task.id, firstTry: attempt === 0, success: true, repairs: attempt, nodes: countNodes(doc.root), documentChars: JSON.stringify(doc).length, htmlChars: htmlSize(doc), outputTokens };
        }
        lastFailure = problems.slice(0, 3).join("; ");
        messages.push({ role: "user", content: repairMessage(problems) });
    }
    return { id: task.id, firstTry: false, success: false, repairs: maxRepairs, failure: lastFailure, outputTokens };
};

const median = (xs: number[]): number | null => {
    if (xs.length === 0) return null;
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

export const summarize = (results: TaskResult[]): Summary => {
    const n = results.length || 1;
    return {
        tasks: results.length,
        firstTryRate: results.filter((r) => r.firstTry).length / n,
        successRate: results.filter((r) => r.success).length / n,
        repairedRate: results.filter((r) => r.success && !r.firstTry).length / n,
        meanRepairs: results.reduce((s, r) => s + r.repairs, 0) / n,
        totalOutputTokens: results.reduce((s, r) => s + r.outputTokens, 0),
        medianHtmlToDocumentRatio: median(results.filter((r) => r.success && r.htmlChars && r.documentChars).map((r) => r.htmlChars! / r.documentChars!)),
    };
};

export type EvalOptions = { model: Model; modelName?: string; tasks?: Task[]; maxRepairs?: number; system?: string };

export const runEval = async (options: EvalOptions): Promise<EvalReport> => {
    const tasks = options.tasks ?? TASKS;
    const maxRepairs = options.maxRepairs ?? 2;
    const system = options.system ?? buildSystemPrompt();
    const results: TaskResult[] = [];
    for (const task of tasks) results.push(await runTask(task, options.model, system, maxRepairs));
    return { model: options.modelName ?? "custom", maxRepairs, results, summary: summarize(results) };
};

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

export const formatReport = (r: EvalReport): string => {
    const lines = [
        `# GenUI eval — ${r.model}`,
        "",
        `| tasks | first try | valid after ≤${r.maxRepairs} repairs | mean repairs | output tokens | HTML ÷ document size |`,
        "|---|---|---|---|---|---|",
        `| ${r.summary.tasks} | ${pct(r.summary.firstTryRate)} | ${pct(r.summary.successRate)} | ${r.summary.meanRepairs.toFixed(2)} | ${r.summary.totalOutputTokens} | ${r.summary.medianHtmlToDocumentRatio?.toFixed(1) ?? "n/a"}× |`,
        "",
        "| task | result | repairs | nodes |",
        "|---|---|---|---|",
        ...r.results.map((t) => `| ${t.id} | ${t.success ? (t.firstTry ? "✅ first try" : "🔧 repaired") : `❌ ${t.failure ?? ""}`} | ${t.repairs} | ${t.nodes ?? "-"} |`),
    ];
    return lines.join("\n");
};
