#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { anthropicModel, openaiModel, referenceModel } from "./models.js";
import { TASKS } from "./tasks.js";
import { formatReport, runEval } from "./runner.js";

const { values } = parseArgs({
    options: {
        provider: { type: "string", default: "anthropic" },
        model: { type: "string" },
        tasks: { type: "string" },
        repairs: { type: "string", default: "2" },
        out: { type: "string" },
        mock: { type: "boolean", default: false },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`genui-eval — how reliably does a model emit valid GenUI documents?

  genui-eval --provider anthropic --model <id>   needs ANTHROPIC_API_KEY
  genui-eval --provider openai --model <id>      needs OPENAI_API_KEY
  genui-eval --mock                              offline: replays the reference answers (plumbing check)

  --tasks <n>     run the first n tasks (default: all ${TASKS.length})
  --repairs <n>   repair rounds allowed after an invalid reply (default 2)
  --out <file>    also write the JSON report`);
    process.exit(0);
}

const main = async () => {
    const need = (name: string) => {
        const v = process.env[name];
        if (!v) throw new Error(`${name} is not set`);
        return v;
    };
    let model;
    let name: string;
    if (values.mock) {
        model = referenceModel();
        name = "reference (mock)";
    } else if (values.provider === "openai") {
        name = values.model ?? "gpt-4o";
        model = openaiModel({ apiKey: need("OPENAI_API_KEY"), model: name });
    } else if (values.provider === "anthropic") {
        name = values.model ?? "claude-sonnet-5-5";
        model = anthropicModel({ apiKey: need("ANTHROPIC_API_KEY"), model: name });
    } else {
        throw new Error(`unknown provider "${values.provider}"`);
    }
    const report = await runEval({ model, modelName: name, tasks: TASKS.slice(0, values.tasks ? Number(values.tasks) : undefined), maxRepairs: Number(values.repairs) });
    console.log(formatReport(report));
    if (values.out) writeFileSync(values.out, JSON.stringify(report, null, 2));
};

main().catch((e) => {
    console.error(`error: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
});
