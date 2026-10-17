// Proves the publishable packages actually work as published: packs every public package, checks the tarballs,
// installs them into an empty project (no workspace links) and runs an end-to-end smoke test on them.
//   pnpm build && node scripts/release-check.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), "genui-release-"));
const packs = join(work, "packs");
mkdirSync(packs);
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const fail = (msg) => {
    console.error(`✗ ${msg}`);
    process.exit(1);
};

// 1. find and pack public packages
const dirs = [];
for (const g of readdirSync(join(root, "packages"))) for (const n of readdirSync(join(root, "packages", g))) {
    try {
        const pkg = JSON.parse(readFileSync(join(root, "packages", g, n, "package.json"), "utf8"));
        if (!pkg.private) dirs.push({ dir: join(root, "packages", g, n), pkg });
    } catch { /* not a node package (e.g. the Python SDK) */ }
}
console.log(`packing ${dirs.length} public packages…`);
const tarballs = {};
for (const { dir, pkg } of dirs) {
    run("pnpm", ["pack", "--pack-destination", packs], dir);
    const file = readdirSync(packs).find((f) => f.startsWith(pkg.name.replace("@", "").replace("/", "-") + "-"));
    if (!file) fail(`no tarball for ${pkg.name}`);
    tarballs[pkg.name] = join(packs, file);

    // 2. inspect the tarball
    const listing = run("tar", ["-tzf", tarballs[pkg.name]]).split("\n").filter(Boolean);
    const has = (p) => listing.some((l) => l === `package/${p}` || l.startsWith(`package/${p}/`));
    for (const need of ["package.json", "README.md", "LICENSE"]) if (!has(need)) fail(`${pkg.name}: tarball is missing ${need}`);
    if (!listing.some((l) => /^package\/(dist|fesm2022)\//.test(l))) fail(`${pkg.name}: tarball has no build output (did you run pnpm build?)`);
    const bad = listing.find((l) => /(\.tsbuildinfo|\/test\/|\.test\.|node_modules)/.test(l));
    if (bad) fail(`${pkg.name}: tarball contains ${bad}`);
    const packed = JSON.parse(run("tar", ["-xzOf", tarballs[pkg.name], "package/package.json"]));
    for (const field of ["dependencies", "peerDependencies"]) for (const [d, range] of Object.entries(packed[field] ?? {})) {
        if (String(range).startsWith("workspace:")) fail(`${pkg.name}: ${d} is still "${range}" in the packed manifest`);
    }
}
console.log("✓ tarballs look right");

// 3. install the tarballs together into a clean project
const proj = join(work, "project");
mkdirSync(proj);
const toFile = (n) => `file:${tarballs[n]}`;
const smoke = ["@genui-protocol/sdk-js", "@genui-protocol/renderer-react", "@genui-protocol/cli", "@genui-protocol/prompt-kit", "@genui-protocol/stream-engine"];
writeFileSync(join(proj, "package.json"), JSON.stringify({
    name: "smoke", private: true, type: "module",
    dependencies: { ...Object.fromEntries(smoke.map((n) => [n, toFile(n)])), react: "^18.3.1", "react-dom": "^18.3.1" },
    overrides: Object.fromEntries(Object.keys(tarballs).map((n) => [n, toFile(n)])),
}, null, 2));
console.log("installing into a clean project (npm)…");
run("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "--legacy-peer-deps"], proj);

// 4. end-to-end smoke test on the installed packages
writeFileSync(join(proj, "smoke.mjs"), `
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ui, bind, tpl, actions, document, assertValid, createSession, diffRuntimeTree, buildRuntimeTree, applyTreePatches, McpClient } from "@genui-protocol/sdk-js";
import { GenUiRenderer } from "@genui-protocol/renderer-react";
import { StreamConsumer } from "@genui-protocol/stream-engine";
import { buildSystemPrompt } from "@genui-protocol/prompt-kit";
import { run } from "@genui-protocol/cli";

const doc = document(
  ui.page({ title: tpl("Hello {{who}}") }, ui.kpi({ label: "Users", value: bind("n") }), ui.button({ label: "Go", onClick: actions.emit("go") })),
  { who: "Ada", n: "42" },
);
assertValid(doc);

const html = renderToStaticMarkup(createElement(GenUiRenderer, { session: createSession({ document: doc }) }));
assert.match(html, /Hello Ada/); assert.match(html, /42/);

const next = { ...doc, root: { ...doc.root, p: { title: "Changed" } } };
const patches = diffRuntimeTree(buildRuntimeTree(doc), buildRuntimeTree(next));
assert.equal(applyTreePatches(buildRuntimeTree(doc), patches).root.p.title, "Changed");

const applied = [];
const consumer = new StreamConsumer({ apply: (f) => (applied.push(f.sequence), { ok: true }), gapTimeoutMs: 0 });
[1, 3, 2].forEach((s) => consumer.push({ type: "patch", sequence: s, patches: [] }));
assert.deepEqual(applied, [1, 2, 3]);

assert.match(buildSystemPrompt(), /\\$bind/);
assert.equal(new McpClient({ baseUrl: "http://x" }) instanceof McpClient, true);

let out = "";
assert.equal(run(["validate", "-"], { stdout: (s) => (out += s), stderr: () => {}, read: () => JSON.stringify(doc) }), 0);
assert.match(out, /valid/);
console.log("smoke ok");
`);
const out = run("node", ["smoke.mjs"], proj);
if (!out.includes("smoke ok")) fail(`smoke test did not complete:\n${out}`);
// the CLI binary as installed
const bin = run("node", [join(proj, "node_modules/@genui-protocol/cli/dist/src/bin.js"), "help"], proj);
if (!bin.includes("Usage: genui")) fail("installed CLI did not run");
console.log("✓ installed packages work end to end (sdk, react renderer, stream consumer, prompt kit, cli)");
console.log(`  (work dir: ${work})`);
