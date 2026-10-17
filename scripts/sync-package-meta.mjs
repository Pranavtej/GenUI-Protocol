// Keeps every publishable package's metadata consistent (and marks placeholders private).
//   node scripts/sync-package-meta.mjs          write changes
//   node scripts/sync-package-meta.mjs --check  exit 1 if anything would change (used in CI)
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const check = process.argv.includes("--check");
const REPO = "https://github.com/Pranavtej/GenUI-Protocol";

// Placeholders with no implementation: never published.
const PRIVATE = new Set([
    "renderers/vue", "renderers/svelte", "renderers/react-native", "renderers/swiftui", "renderers/flutter",
    "components/core", "components/data", "components/charts", "components/forms", "components/workflows",
    "tooling/testing",
]);

const DESCRIPTIONS = {
    "@genui-protocol/protocol": "Shared contract for GenUI Protocol: actions, expressions, stream frames and patch types",
    "@genui-protocol/ast": "Document and node types for GenUI Protocol",
    "@genui-protocol/schemas": "Published JSON Schemas for GenUI documents, patches, actions and stream frames",
    "@genui-protocol/component-registry": "Built-in component catalogue (props schemas, events, examples) for GenUI Protocol",
    "@genui-protocol/runtime-core": "Framework-neutral GenUI runtime: id-keyed diff, RFC 6902 patches, data store, actions and RuntimeSession",
    "@genui-protocol/validation": "Validator for GenUI documents: limits, props, URL checks, actions and allow-lists",
    "@genui-protocol/stream-engine": "Ordered stream consumer with resync, and an SSE client, for GenUI frames",
    "@genui-protocol/state-engine": "Signal-based reactive state for GenUI runtimes",
    "@genui-protocol/event-engine": "Event routing for GenUI interactions",
    "@genui-protocol/renderer-react": "React renderer for GenUI Protocol documents",
    "@genui-protocol/angular": "Angular renderer for GenUI Protocol documents (reference implementation)",
    "@genui-protocol/theme-engine": "Design tokens to CSS variables for GenUI renderers",
    "@genui-protocol/sdk-js": "Typed builders and MCP client for GenUI Protocol",
    "@genui-protocol/prompt-kit": "System prompt, few-shot examples and tool definitions that teach LLMs to emit valid GenUI documents",
};

const readme = (pkg, rel) => `# ${pkg.name}

${pkg.description ?? ""}

Part of [GenUI Protocol](${REPO}) — let AI agents answer with interfaces, not just text.

- Documentation: ${REPO}#readme
- Source: ${REPO}/tree/main/packages/${rel}
- License: MIT
`;

const changed = [];
const touch = (file, next) => {
    const prev = existsSync(file) ? readFileSync(file, "utf8") : null;
    if (prev !== next) {
        changed.push(file.replace(root, ""));
        if (!check) writeFileSync(file, next);
    }
};

for (const group of readdirSync(join(root, "packages"))) {
    for (const name of readdirSync(join(root, "packages", group))) {
        const rel = `${group}/${name}`;
        const dir = join(root, "packages", rel);
        const file = join(dir, "package.json");
        if (!existsSync(file)) continue;
        const pkg = JSON.parse(readFileSync(file, "utf8"));

        if (PRIVATE.has(rel)) {
            pkg.private = true;
            delete pkg.publishConfig;
        } else {
            pkg.private = false;
            if (DESCRIPTIONS[pkg.name]) pkg.description = DESCRIPTIONS[pkg.name];
            pkg.license = "MIT";
            pkg.repository = { type: "git", url: `git+${REPO}.git`, directory: `packages/${rel}` };
            pkg.bugs = { url: `${REPO}/issues` };
            pkg.homepage = `${REPO}#readme`;
            pkg.publishConfig = { ...(pkg.publishConfig ?? {}), access: "public", provenance: true };
            pkg.engines = { node: ">=18" };
            if (pkg.publishConfig?.directory) {
                // ng-packagr builds a publishable folder (dist/) with its own manifest: it generates the entry points and
                // copies README/LICENSE through `assets` in ng-package.json, so none of that belongs in the source manifest.
                delete pkg.files;
                delete pkg.main;
                delete pkg.types;
                delete pkg.exports;
            } else {
                pkg.files = ["dist", "src", "!**/*.tsbuildinfo", "README.md", "LICENSE"];
            }
            if (!existsSync(join(dir, "README.md"))) touch(join(dir, "README.md"), readme(pkg, rel));
            if (!check) copyFileSync(join(root, "LICENSE"), join(dir, "LICENSE"));
            else if (!existsSync(join(dir, "LICENSE"))) changed.push(`packages/${rel}/LICENSE`);
        }
        // `workspace:0.1.0` pins break the moment a version is bumped; `workspace:^` is rewritten to ^<version> on publish.
        for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
            for (const [dep, range] of Object.entries(pkg[field] ?? {})) if (/^workspace:\d/.test(range)) pkg[field][dep] = "workspace:^";
        }
        touch(file, JSON.stringify(pkg, null, 2) + "\n");
    }
}

// apps and examples reference workspace packages too.
for (const group of ["apps", "examples"]) {
    for (const name of readdirSync(join(root, group))) {
        const file = join(root, group, name, "package.json");
        if (!existsSync(file)) continue;
        const raw = readFileSync(file, "utf8");
        const next = raw.replace(/"workspace:\d[^"]*"/g, '"workspace:^"');
        touch(file, next);
    }
}

console.log(changed.length ? `${check ? "would change" : "updated"}: ${changed.length} file(s)` : "package metadata is in sync");
if (check && changed.length) {
    console.log(changed.join("\n"));
    process.exit(1);
}
