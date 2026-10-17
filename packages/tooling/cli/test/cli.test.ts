import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, type IO } from "../src/index";

const files: Record<string, string> = {
    "ok.json": JSON.stringify({ version: "1.0.0", root: { t: "page", p: { title: "Hi" }, c: [{ t: "text", id: "a", p: { content: "x" } }] } }),
    "next.json": JSON.stringify({ version: "1.0.0", root: { t: "page", p: { title: "Hi" }, c: [{ t: "text", id: "b", p: { content: "y" } }, { t: "text", id: "a", p: { content: "x" } }] } }),
    "bad.json": JSON.stringify({ version: "1.0.0", root: { t: "page", p: { title: "Hi" }, c: [{ t: "nope" }] } }),
    "garbage.json": "{not json",
    "patches.json": JSON.stringify([{ op: "replace", path: "/p/title", value: "Patched" }]),
    "badpatches.json": JSON.stringify([{ op: "remove", path: "/c/9" }]),
};

const harness = (stdin = "") => {
    const o = { out: "", err: "" };
    const io: IO = {
        stdout: (s) => void (o.out += s),
        stderr: (s) => void (o.err += s),
        read: (p) => {
            if (p === "-") return stdin;
            if (!(p in files)) throw Object.assign(new Error("nope"), { code: "ENOENT" });
            return files[p];
        },
    };
    return { o, io };
};

describe("genui cli", () => {
    it("validate: exit codes, messages, json and stdin", () => {
        let h = harness();
        expect(run(["validate", "ok.json"], h.io)).toBe(0);
        expect(h.o.out).toContain("✓ valid");

        h = harness();
        expect(run(["validate", "bad.json"], h.io)).toBe(1);
        expect(h.o.err).toContain("Unknown component type");

        h = harness();
        expect(run(["validate", "bad.json", "--json"], h.io)).toBe(1);
        expect(JSON.parse(h.o.out).valid).toBe(false);

        h = harness(files["ok.json"]);
        expect(run(["validate", "-"], h.io)).toBe(0);

        h = harness();
        expect(run(["validate", "ok.json", "--renderer", "flutter"], h.io)).toBe(1); 
    });

    it("usage errors exit 2 with a helpful message", () => {
        for (const args of [["validate"], ["validate", "missing.json"], ["validate", "garbage.json"], ["bogus"], ["diff", "ok.json"], ["scaffold", "nope"], ["validate", "--wat", "ok.json"]]) {
            const h = harness();
            expect(run(args, h.io), args.join(" ")).toBe(2);
            expect(h.o.err).toMatch(/^error: /);
        }
    });

    it("diff then patch round-trips", () => {
        const h = harness();
        expect(run(["diff", "ok.json", "next.json"], h.io)).toBe(0);
        const patches = JSON.parse(h.o.out);
        expect(patches).toEqual([{ op: "add", path: "/c/0", value: { t: "text", id: "b", p: { content: "y" } } }]);
        files["roundtrip.json"] = JSON.stringify(patches);
        const p = harness();
        expect(run(["patch", "ok.json", "roundtrip.json"], p.io)).toBe(0);
        expect(JSON.parse(p.o.out).root.c.map((c: { id: string }) => c.id)).toEqual(["b", "a"]);
    });

    it("patch reports failures with exit 1", () => {
        const h = harness();
        expect(run(["patch", "ok.json", "patches.json"], h.io)).toBe(0);
        expect(JSON.parse(h.o.out).root.p.title).toBe("Patched");
        const bad = harness();
        expect(run(["patch", "ok.json", "badpatches.json"], bad.io)).toBe(1);
        expect(bad.o.err).toContain("patch failed");
    });

    it("scaffolds valid starters", () => {
        const list = harness();
        run(["scaffold"], list.io);
        for (const name of list.o.out.trim().split("\n")) {
            const h = harness();
            expect(run(["scaffold", name], h.io)).toBe(0);
            files[`${name}.scaffold.json`] = h.o.out;
            const v = harness();
            expect(run(["validate", `${name}.scaffold.json`], v.io), name).toBe(0);
        }
    });

    it("components, schema and prompt", () => {
        let h = harness();
        expect(run(["components"], h.io)).toBe(0);
        expect(h.o.out).toContain("kpi");
        h = harness();
        expect(run(["components", "kpi"], h.io)).toBe(0);
        expect(JSON.parse(h.o.out).id).toBe("kpi");
        h = harness();
        expect(run(["schema", "action"], h.io)).toBe(0);
        expect(JSON.parse(h.o.out).title).toBe("GenUI Action");
        h = harness();
        expect(run(["prompt"], h.io)).toBe(0);
        expect(h.o.out).toContain("$bind");
    });

    it("the built binary works end to end", () => {
        const bin = join(__dirname, "../dist/src/bin.js");
        const ok = spawnSync("node", [bin, "validate", "-"], { input: files["ok.json"], encoding: "utf8" });
        expect(ok.status).toBe(0);
        const bad = spawnSync("node", [bin, "validate", "-"], { input: files["bad.json"], encoding: "utf8" });
        expect(bad.status).toBe(1);
        expect(execFileSync("node", [bin, "help"], { encoding: "utf8" })).toContain("Usage: genui");
    });
});
