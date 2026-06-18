#!/usr/bin/env node
const { execSync, spawn } = require("child_process");
const path = require("path");
const readline = require("readline");

const ROOT = __dirname;

// Map of app names to their config
const APPS = {
  "test-app": {
    label: "Test App (Angular + SSE stream)",
    dir: "apps/test-app",
    deps: [
      "packages/core/ast",
      "packages/core/protocol",
      "packages/runtime/runtime-core",
      "packages/runtime/event-engine",
      "packages/runtime/state-engine",
      "packages/runtime/stream-engine",
      "packages/runtime/validation",
      "packages/components/component-registry",
      "packages/renderers/angular-ui",
      "packages/renderers/angular",
    ],
    cmd: "node node_modules/@angular/cli/bin/ng.js serve --open",
  },
  "playground-angular": {
    label: "Playground Angular (AST Editor + Canvas)",
    dir: "apps/playground-angular",
    deps: [
      "packages/core/ast",
      "packages/core/protocol",
      "packages/runtime/runtime-core",
      "packages/runtime/event-engine",
      "packages/runtime/state-engine",
      "packages/runtime/stream-engine",
      "packages/runtime/validation",
      "packages/components/component-registry",
      "packages/renderers/angular-ui",
      "packages/renderers/angular",
    ],
    cmd: "node node_modules/@angular/cli/bin/ng.js serve --open",
  },
  "playground": {
    label: "Playground React (Vite + React)",
    dir: "apps/playground",
    deps: ["packages/core/ast", "packages/core/protocol", "packages/runtime/runtime-core"],
    cmd: "npx vite",
  },
  "docs": {
    label: "Docs (Docusaurus)",
    dir: "apps/docs",
    deps: [],
    cmd: "npx docusaurus start",
  },
  "registry-ui": {
    label: "Registry UI (Vite + React)",
    dir: "apps/registry-ui",
    deps: [],
    cmd: "npx vite",
  },
  "mcp-server": {
    label: "MCP Server (Node.js)",
    dir: "apps/mcp-server",
    deps: [
      "packages/core/ast",
      "packages/core/protocol",
      "packages/runtime/validation",
      "packages/components/component-registry",
    ],
    cmd: "node --enable-source-maps dist/index.js",
  },
};

function prompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n  \x1b[1mGenUI Protocol – Dev Launcher\x1b[0m\n");
  const entries = Object.entries(APPS);
  entries.forEach(([key, app], i) => {
    console.log(`  \x1b[36m${i + 1}\x1b[0m) ${app.label}`);
  });
  console.log(`  \x1b[36m${entries.length + 1}\x1b[0m) Build all packages`);

  return new Promise((resolve) => {
    rl.question(`\n  Select (1-${entries.length + 1}): `, (answer) => {
      rl.close();
      const idx = parseInt(answer.trim(), 10) - 1;
      if (idx >= 0 && idx < entries.length) {
        resolve({ app: entries[idx][1], key: entries[idx][0] });
      } else if (idx === entries.length) {
        resolve({ app: null, key: "build-all" });
      } else {
        console.log("  Invalid selection.");
        process.exit(1);
      }
    });
  });
}

function buildPackages(deps) {
  if (deps.length === 0) return;
  console.log("\n  \x1b[33mBuilding dependencies...\x1b[0m\n");
  for (const dep of deps) {
    const pkgDir = path.join(ROOT, dep);
    console.log(`  \x1b[2m→ Building ${dep}\x1b[0m`);
    try {
      execSync("npx tsc -p tsconfig.json", {
        cwd: pkgDir,
        stdio: "pipe",
        timeout: 60000,
      });
    } catch (e) {
      // If tsc fails, try npm run build
      try {
        execSync("npm run build", { cwd: pkgDir, stdio: "pipe", timeout: 60000 });
      } catch (e2) {
        console.error(`  \x1b[31mFailed to build ${dep}\x1b[0m`);
        console.error(e2.stderr?.toString() || e2.message);
        process.exit(1);
      }
    }
  }
  console.log("");
}

function runApp(app) {
  const appDir = path.join(ROOT, app.dir);
  console.log(`  \x1b[32mStarting: ${app.label}\x1b[0m\n`);

  const child = spawn("sh", ["-c", app.cmd], {
    cwd: appDir,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function main() {
  const { app, key } = await prompt();

  if (key === "build-all") {
    // Build every JS package
    const { execSync } = require("child_process");
    execSync("pnpm build", { cwd: ROOT, stdio: "inherit" });
    console.log("\n  \x1b[32mAll packages built.\x1b[0m\n");
    return;
  }

  // Ensure dist of angular-ui has theme CSS
  const uiDistTheme = path.join(ROOT, "packages/renderers/angular-ui/dist/theme/default.css");
  const fs = require("fs");
  if (!fs.existsSync(uiDistTheme)) {
    const uiSrcTheme = path.join(ROOT, "packages/renderers/angular-ui/src/theme/default.css");
    if (fs.existsSync(uiSrcTheme)) {
      fs.mkdirSync(path.dirname(uiDistTheme), { recursive: true });
      fs.copyFileSync(uiSrcTheme, uiDistTheme);
    }
  }

  buildPackages(app.deps);
  runApp(app);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
