import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { loadConfig, type Config } from "../src/config";
import { createLogger } from "../src/logger";
import { createHttpApp } from "../src/http";

const make = (env: Record<string, string> = {}) => {
    const config: Config = loadConfig({ GENUI_LOG_LEVEL: "silent", ...env } as NodeJS.ProcessEnv);
    return { config, ...createHttpApp({ registry: new ComponentRegistry(), config, logger: createLogger("silent") }) };
};

const doc = { version: "1.0.0", data: { n: 1 }, root: { t: "page", p: { title: "Hi" }, c: [{ t: "text", p: { content: { $bind: "n" } } }] } };

describe("config", () => {
    it("has safe defaults and parses env", () => {
        const c = loadConfig({} as NodeJS.ProcessEnv);
        expect(c).toMatchObject({ host: "127.0.0.1", port: 4000, bodyLimit: "1mb", rateLimit: { max: 120 } });
        const d = loadConfig({ PORT: "5000", GENUI_API_KEY: "k", GENUI_CORS_ORIGINS: "https://a.com, https://b.com", GENUI_RATE_MAX: "5", GENUI_LOG_LEVEL: "bogus" } as NodeJS.ProcessEnv);
        expect(d).toMatchObject({ port: 5000, apiKey: "k", corsOrigins: ["https://a.com", "https://b.com"], rateLimit: { max: 5 }, logLevel: "info" });
    });
});

describe("auth", () => {
    it("health is open; everything else needs the key", async () => {
        const { app } = make({ GENUI_API_KEY: "secret" });
        await request(app).get("/api/health").expect(200);
        await request(app).get("/api/discover_components").expect(401);
        await request(app).get("/api/discover_components").set("Authorization", "Bearer nope").expect(401);
        await request(app).get("/api/discover_components").set("Authorization", "Bearer secret").expect(200);
        await request(app).get("/api/discover_components").set("X-API-Key", "secret").expect(200);
    });

    it("is open when no key is configured", async () => {
        await request(make().app).get("/api/discover_components").expect(200);
    });
});

describe("rate limiting", () => {
    it("returns 429 after the limit and never limits health", async () => {
        const { app } = make({ GENUI_RATE_MAX: "3" });
        for (let i = 0; i < 3; i++) await request(app).get("/api/list_renderers").expect(200);
        const res = await request(app).get("/api/list_renderers").expect(429);
        expect(res.headers["retry-after"]).toBeDefined();
        await request(app).get("/api/health").expect(200);
    });
});

describe("routes", () => {
    it("validates documents and bare roots", async () => {
        const { app } = make();
        expect((await request(app).post("/api/validate_document").send({ document: doc })).body).toEqual({ valid: true });
        expect((await request(app).post("/api/validate_ast").send({ document: { ...doc, version: "9.0.0" } })).body.valid).toBe(false);
        expect((await request(app).post("/api/validate_ast").send({ root: { t: "nope" } })).body.valid).toBe(false);
        await request(app).post("/api/validate_ast").send({}).expect(400);
    });

    it("serves the protocol guide", async () => {
        const res = await request(make().app).get("/api/protocol_guide").expect(200);
        expect(res.body.systemPrompt).toContain("$bind");
        expect(res.body.tools.map((t: { name: string }) => t.name)).toContain("render_ui");
    });

    it("generates deterministic unique ids and valid templates", async () => {
        const { app } = make();
        const root = { t: "stack", c: [{ t: "text", id: "text-1", p: { content: "a" } }, { t: "text", p: { content: "b" } }] };
        const a = (await request(app).post("/api/generate_ast").send({ root })).body;
        const b = (await request(app).post("/api/generate_ast").send({ root })).body;
        expect(a).toEqual(b);
        const ids = [a.root.id, ...a.root.c.map((c: { id: string }) => c.id)];
        expect(new Set(ids).size).toBe(3);
        for (const type of ["dashboard", "workflow", "form", "analytics", "chat", "settings", "blank"]) {
            const t = (await request(app).get("/api/generate_template").query({ type })).body;
            const v = (await request(app).post("/api/validate_document").send({ document: t })).body;
            expect(v, type).toEqual({ valid: true });
        }
        await request(app).get("/api/generate_template").query({ type: "nope" }).expect(404);
    });

    it("suggests components and reports metadata", async () => {
        const { app } = make();
        const s = (await request(app).post("/api/suggest_components").send({ description: "a login form" })).body;
        expect(s.suggestions[0].component.id).toBeDefined();
        await request(app).post("/api/suggest_components").send({}).expect(400);
        const m = (await request(app).post("/api/ast_metadata").send({ root: doc.root })).body;
        expect(m).toMatchObject({ count: 2, maxDepth: 2 });
    });
});

describe("hardening", () => {
    it("rejects malformed JSON and oversized bodies", async () => {
        const { app } = make({ GENUI_BODY_LIMIT: "1kb" });
        await request(app).post("/api/validate_ast").set("Content-Type", "application/json").send("{nope").expect(400);
        await request(app).post("/api/validate_ast").send({ root: { t: "text", p: { content: "x".repeat(5000) } } }).expect(413);
    });

    it("returns json 404 for unknown api routes and a request id", async () => {
        const res = await request(make().app).get("/api/nope").expect(404);
        expect(res.body).toEqual({ error: "not_found" });
        expect(res.headers["x-request-id"]).toMatch(/[0-9a-f-]{36}/);
    });

    it("applies the CORS allow-list", async () => {
        const { app } = make({ GENUI_CORS_ORIGINS: "https://good.example" });
        const ok = await request(app).get("/api/health").set("Origin", "https://good.example");
        const bad = await request(app).get("/api/health").set("Origin", "https://evil.example");
        expect(ok.headers["access-control-allow-origin"]).toBe("https://good.example");
        expect(bad.headers["access-control-allow-origin"]).toBeUndefined();
    });
});

describe("streaming", () => {
    let server: Server | undefined;
    afterEach(() => new Promise<void>((r) => (server ? server.close(() => r()) : r())));

    it("rejects invalid snapshots and sequences frames", async () => {
        const { app } = make();
        const bad = await request(app).post("/api/stream_ast").send({ ast: { version: "1.0.0", root: { t: "nope" } } }).expect(400);
        expect(bad.body.error).toBe("invalid_ast");
        expect((await request(app).post("/api/stream_ast").send({ ast: doc })).body.sequence).toBe(1);
        expect((await request(app).post("/api/stream_patch").send({ patches: [] })).body.sequence).toBe(2);
        await request(app).post("/api/stream_patch").send({}).expect(400);
    });

    it("replays the snapshot and later frames to late joiners over SSE", async () => {
        const { app } = make({ PORT: "0" });
        server = await new Promise<Server>((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
        const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        await post("/api/stream_ast", { ast: doc });
        await post("/api/stream_data", { patches: [{ op: "replace", path: "/n", value: 2 }] });

        const ctl = new AbortController();
        const res = await fetch(base + "/api/stream", { signal: ctl.signal });
        const reader = res.body!.getReader();
        let buf = "";
        while ((buf.match(/\n\n/g) ?? []).length < 2) buf += new TextDecoder().decode((await reader.read()).value);
        ctl.abort();
        const frames = buf.split("\n\n").filter(Boolean).map((l) => JSON.parse(l.replace(/^data: /, "")));
        expect(frames.map((f) => [f.type, f.sequence])).toEqual([["snapshot", 1], ["data", 2]]);
    });
});
