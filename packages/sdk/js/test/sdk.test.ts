import { describe, expect, it, vi } from "vitest";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import {
    InvalidDocumentError, McpClient, McpHttpError, actions, assertValid, bind, createSession, custom, document, tpl, ui, validateDocument, createValidator,
} from "../src/index";

describe("builders", () => {
    it("build documents the validator accepts, with bindings and actions", () => {
        const doc = document(
            ui.page({ title: tpl("Hello {{user}}") },
                ui.grid({ cols: 2 },
                    ui.kpi({ id: "users", label: "Users", value: bind("metrics.users") }),
                    false && ui.kpi({ label: "hidden", value: "0" }),
                ),
                ui.chart({ type: "bar", data: bind("traffic") }),
                ui.input({ id: "name", label: "Name", value: bind("form.name") }),
                ui.button({ label: "Go", onClick: [actions.setData("busy", true), actions.submit("go", "form")] }),
            ),
            { user: "Ada", metrics: { users: "12" }, traffic: [{ label: "Mon", value: 1 }], form: { name: "" }, busy: false }
        );
        expect(validateDocument(doc)).toEqual({ valid: true });
        expect(doc.root.c![0].c).toHaveLength(1); // falsy children dropped
        expect(doc.root.c![0].c![0].id).toBe("users");
    });

    it("omits undefined props and empty children", () => {
        expect(ui.card()).toEqual({ t: "card" });
        expect(ui.text({ content: "x", bold: undefined })).toEqual({ t: "text", p: { content: "x" } });
    });

    it("rendered output matches the data model", async () => {
        const doc = document(ui.page({ title: "T" }, ui.text({ content: bind("n") }), ui.button({ id: "b", label: "+", onClick: actions.setData("n", 5) })), { n: 1 });
        const s = createSession({ document: doc });
        expect(s.resolveProps(s.tree!.root.children![0]).content).toBe(1);
        await s.dispatch(s.tree!.root.children![1], "onClick");
        expect(s.resolveProps(s.tree!.root.children![0]).content).toBe(5);
    });

    it("supports namespaced custom components", () => {
        const registry = new ComponentRegistry();
        registry.registerCustom({ id: "acme:gauge", category: "data", renderers: ["react"], schema: { type: "object", properties: { value: { type: "number" } }, required: ["value"] } });
        const doc = document(ui.stack({}, custom("acme:gauge", { value: 3 })));
        expect(createValidator({ registry }).validateDocument(doc)).toEqual({ valid: true });
    });
});

describe("assertValid", () => {
    it("returns valid documents and throws a readable error otherwise", () => {
        const ok = document(ui.page({ title: "x" }));
        expect(assertValid(ok)).toBe(ok);
        try {
            assertValid({ version: "1.0.0", root: { t: "nope" } });
            expect.unreachable();
        } catch (e) {
            expect(e).toBeInstanceOf(InvalidDocumentError);
            expect((e as InvalidDocumentError).errors.join()).toContain("Unknown component");
        }
    });
});

describe("McpClient", () => {
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

    it("sends the api key, encodes params and parses json", async () => {
        const fetchMock = vi.fn(async () => json(200, { valid: true }));
        const client = new McpClient({ baseUrl: "http://x:4000/", apiKey: "k", fetch: fetchMock as unknown as typeof fetch });
        await client.validate({ version: "1.0.0", root: { t: "page" } });
        await client.getComponent("a b");
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe("http://x:4000/api/validate_document");
        expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k");
        expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe("http://x:4000/api/get_component?name=a%20b");
    });

    it("throws McpHttpError with the server's message", async () => {
        const client = new McpClient({ baseUrl: "http://x", fetch: (async () => json(401, { error: "unauthorized", message: "A valid API key is required." })) as typeof fetch });
        await expect(client.discoverComponents()).rejects.toMatchObject({ name: "McpHttpError", status: 401, message: expect.stringContaining("A valid API key is required.") });
        expect(McpHttpError).toBeDefined();
    });

    it("subscribes to frames with auth headers", async () => {
        const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"type":"patch","sequence":1,"patches":[]}\n\n')); c.close(); } });
        const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
        const frames: unknown[] = [];
        const conn = new McpClient({ baseUrl: "http://x", apiKey: "k", fetch: fetchMock as unknown as typeof fetch }).subscribe((f) => frames.push(f));
        await conn.done;
        expect(frames).toHaveLength(1);
        expect(((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>).Authorization).toBe("Bearer k");
    });
});
