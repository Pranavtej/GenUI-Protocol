import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { createMcpServer } from "../src/mcp";

const connect = async () => {
    const server = createMcpServer(new ComponentRegistry());
    const client = new Client({ name: "test", version: "1.0.0" });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(a), client.connect(b)]);
    return client;
};

const call = async (client: Client, name: string, args: Record<string, unknown> = {}) => {
    const res = (await client.callTool({ name, arguments: args })) as { isError?: boolean; content: Array<{ text: string }> };
    return { isError: res.isError ?? false, text: res.content[0].text };
};

describe("MCP tools", () => {
    it("lists every tool, starting with the guide", async () => {
        const client = await connect();
        const { tools } = await client.listTools();
        expect(tools[0].name).toBe("get_protocol_guide");
        expect(tools.map((t) => t.name)).toEqual(expect.arrayContaining(["validate_ast", "generate_template", "discover_components", "ast_metadata"]));
    });

    it("the guide teaches bindings and actions", async () => {
        const { text } = await call(await connect(), "get_protocol_guide");
        expect(text).toContain("$bind");
        expect(text).toContain('"do": "submit"');
        expect(text).toContain("- kpi —");
    });

    it("validates documents and reports errors", async () => {
        const client = await connect();
        const ok = await call(client, "validate_ast", { document: { version: "1.0.0", root: { t: "page", p: { title: "x" } } } });
        expect(ok.text).toContain("✅ Valid");
        const bad = await call(client, "validate_ast", { document: { version: "1.0.0", root: { t: "page", p: { title: "x" }, c: [{ t: "nope" }] } } });
        expect(bad.text).toContain("Unknown component type");
        expect((await call(client, "validate_ast", {})).isError).toBe(true);
    });

    it("handles unknown components and tools without throwing", async () => {
        const client = await connect();
        expect((await call(client, "get_component", { name: "kp" })).text).toContain("Did you mean");
        expect((await call(client, "does_not_exist")).isError).toBe(true);
        expect((await call(client, "generate_template", { type: "nope" })).isError).toBe(true);
    });

    it("the form template carries data bindings and a submit action", async () => {
        const { text } = await call(await connect(), "generate_template", { type: "form" });
        expect(text).toContain('"$bind": "form.hostname"');
        expect(text).toContain('"do": "submit"');
        expect(text).toContain('"data"');
    });
});
