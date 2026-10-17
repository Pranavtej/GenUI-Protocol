import type { Model } from "./runner.js";
import { TASKS } from "./tasks.js";

type Fetch = typeof fetch;

const post = async (fetchImpl: Fetch, url: string, headers: Record<string, string>, body: unknown): Promise<unknown> => {
    const res = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
    const json: unknown = await res.json().catch(() => undefined);
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}: ${JSON.stringify(json)?.slice(0, 300)}`);
    return json;
};

export const anthropicModel = (opts: { apiKey: string; model: string; maxTokens?: number; fetch?: Fetch }): Model => async (system, messages) => {
    const json = (await post(opts.fetch ?? fetch, "https://api.anthropic.com/v1/messages", { "x-api-key": opts.apiKey, "anthropic-version": "2023-06-01" }, {
        model: opts.model, max_tokens: opts.maxTokens ?? 4096, system, messages,
    })) as { content?: Array<{ type: string; text?: string }>; usage?: { input_tokens?: number; output_tokens?: number } };
    return { text: (json.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join(""), inputTokens: json.usage?.input_tokens, outputTokens: json.usage?.output_tokens };
};

export const openaiModel = (opts: { apiKey: string; model: string; maxTokens?: number; baseUrl?: string; fetch?: Fetch }): Model => async (system, messages) => {
    const json = (await post(opts.fetch ?? fetch, `${opts.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`, { Authorization: `Bearer ${opts.apiKey}` }, {
        model: opts.model, max_tokens: opts.maxTokens ?? 4096, messages: [{ role: "system", content: system }, ...messages],
    })) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    return { text: json.choices?.[0]?.message?.content ?? "", inputTokens: json.usage?.prompt_tokens, outputTokens: json.usage?.completion_tokens };
};

/** Offline model that answers every task with its reference document: verifies the plumbing without an API key. */
export const referenceModel = (): Model => async (_system, messages) => {
    const prompt = messages[0].content;
    const task = TASKS.find((t) => t.prompt === prompt);
    return { text: "```json\n" + JSON.stringify(task?.reference ?? {}) + "\n```" };
};
