import { describe, expect, it } from "vitest";
import { validateDocument } from "@genui-protocol/validation";
import { TASKS, anthropicModel, checkFeatures, extractDocument, formatReport, openaiModel, referenceModel, runEval, summarize, type Model } from "../src/index";

const fenced = (v: unknown) => "```json\n" + JSON.stringify(v) + "\n```";

describe("tasks", () => {
    it("every reference answer is valid and satisfies its own feature checks", () => {
        for (const t of TASKS) {
            expect(validateDocument(t.reference), t.id).toEqual({ valid: true });
            expect(checkFeatures(t, t.reference), t.id).toEqual([]);
        }
    });

    it("feature checks catch missing pieces", () => {
        const form = TASKS.find((t) => t.id === "signup-form")!;
        const failures = checkFeatures(form, { version: "1.0.0", root: { t: "page", p: { title: "x" } } });
        expect(failures.join()).toMatch(/missing component "input"/);
        expect(failures.join()).toMatch(/data binding/);
        expect(failures.join()).toMatch(/action prop/);
    });
});

describe("extractDocument", () => {
    it("handles fences, bare json, prose around json and bare roots", () => {
        const doc = { version: "1.0.0", root: { t: "page", p: { title: "x" } } };
        expect(extractDocument(fenced(doc)).doc).toEqual(doc);
        expect(extractDocument(JSON.stringify(doc)).doc).toEqual(doc);
        expect(extractDocument(`Sure! ${JSON.stringify(doc)} Hope it helps`).doc).toEqual(doc);
        expect(extractDocument(JSON.stringify(doc.root)).doc).toEqual(doc);
        expect(extractDocument("no json at all").error).toBeDefined();
        expect(extractDocument('{"a":1}').error).toMatch(/not a document/);
    });
});

describe("runEval", () => {
    it("a perfect model scores 100% first try and the document is smaller than its HTML", async () => {
        const report = await runEval({ model: referenceModel(), modelName: "ref" });
        expect(report.summary).toMatchObject({ tasks: TASKS.length, firstTryRate: 1, successRate: 1, meanRepairs: 0 });
        expect(report.summary.medianHtmlToDocumentRatio).toBeGreaterThan(1);
        expect(formatReport(report)).toContain("first try");
    });

    it("repairs an invalid first reply using the validator's errors", async () => {
        const task = TASKS[0];
        const seen: string[] = [];
        const model: Model = async (_s, messages) => {
            seen.push(messages[messages.length - 1].content);
            return { text: messages.length === 1 ? fenced({ version: "1.0.0", root: { t: "nope" } }) : fenced(task.reference), outputTokens: 10 };
        };
        const report = await runEval({ model, tasks: [task], maxRepairs: 2 });
        expect(report.results[0]).toMatchObject({ success: true, firstTry: false, repairs: 1, outputTokens: 20 });
        expect(seen[1]).toContain("Unknown component type");
        expect(report.summary.repairedRate).toBe(1);
    });

    it("gives up after maxRepairs and reports why", async () => {
        const model: Model = async () => ({ text: "I cannot do that." });
        const report = await runEval({ model, tasks: [TASKS[0]], maxRepairs: 1 });
        expect(report.results[0]).toMatchObject({ success: false, repairs: 1 });
        expect(report.results[0].failure).toMatch(/no JSON found/);
        expect(report.summary.successRate).toBe(0);
    });

    it("rejects a valid document that misses the task's features", async () => {
        const model: Model = async () => ({ text: fenced({ version: "1.0.0", root: { t: "page", p: { title: "empty" } } }) });
        const report = await runEval({ model, tasks: [TASKS.find((t) => t.id === "table")!], maxRepairs: 0 });
        expect(report.results[0].success).toBe(false);
        expect(report.results[0].failure).toMatch(/missing component "table"/);
    });

    it("summarize handles an empty run", () => {
        expect(summarize([])).toMatchObject({ tasks: 0, firstTryRate: 0, medianHtmlToDocumentRatio: null });
    });
});

describe("providers", () => {
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

    it("anthropic: sends key + version header and parses text and usage", async () => {
        let init: RequestInit | undefined;
        const model = anthropicModel({ apiKey: "k", model: "m", fetch: (async (_u: string, i: RequestInit) => ((init = i), json({ content: [{ type: "text", text: "hi" }], usage: { output_tokens: 7 } }))) as unknown as typeof fetch });
        expect(await model("sys", [{ role: "user", content: "x" }])).toMatchObject({ text: "hi", outputTokens: 7 });
        expect((init!.headers as Record<string, string>)["x-api-key"]).toBe("k");
        expect(JSON.parse(init!.body as string)).toMatchObject({ model: "m", system: "sys" });
    });

    it("openai: puts the system prompt first and surfaces http errors", async () => {
        let body = "";
        const ok = openaiModel({ apiKey: "k", model: "m", fetch: (async (_u: string, i: RequestInit) => ((body = i.body as string), json({ choices: [{ message: { content: "yo" } }], usage: { completion_tokens: 3 } }))) as unknown as typeof fetch });
        expect(await ok("sys", [{ role: "user", content: "x" }])).toMatchObject({ text: "yo", outputTokens: 3 });
        expect(JSON.parse(body).messages[0]).toEqual({ role: "system", content: "sys" });
        const bad = openaiModel({ apiKey: "k", model: "m", fetch: (async () => new Response('{"error":"nope"}', { status: 401 })) as unknown as typeof fetch });
        await expect(bad("s", [])).rejects.toThrow(/HTTP 401/);
    });
});
