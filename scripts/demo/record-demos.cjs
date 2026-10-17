/* Records the demo videos in docs/assets/demos (mp4 for the docs site, gif for the README) by driving the real apps.
 *
 *   pnpm build
 *   (cd examples/react-app && npx vite preview --port 4175) &
 *   (cd apps/playground && npx vite preview --port 4173) &
 *   (cd apps/playground-angular/dist/playground-angular/browser && python3 -m http.server 4303) &
 *   NODE_PATH=$(npm root -g) node scripts/demo/record-demos.cjs [charts cards monitor json renderers]
 *
 * Needs Playwright (with Chromium) and ffmpeg. CHROME_PATH overrides the browser binary.
 */
const { execFileSync } = require("node:child_process");
const { mkdirSync, rmSync, readdirSync, renameSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("playwright");

const OUT = join(__dirname, "../../docs/assets/demos");
const TMP = join(require("node:os").tmpdir(), "genui-demos");
const REACT = process.env.REACT_URL || "http://localhost:4175";
const PLAY = process.env.PLAYGROUND_URL || "http://localhost:4173";
const NG = process.env.ANGULAR_URL || "http://localhost:4303";
const SIZE = { width: 1100, height: 680 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A visible cursor and click ripple (recordings do not show the OS cursor), plus a caption bar.
const OVERLAY = `
(() => {
  const mk = () => {
    if (document.getElementById("__cap")) return;
    const style = document.createElement("style");
    style.textContent = \`
      #__cursor{position:fixed;z-index:2147483647;width:18px;height:18px;margin:-3px 0 0 -3px;pointer-events:none;
        border-radius:50%;background:rgba(37,99,235,.85);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transition:transform .08s}
      .__ripple{position:fixed;z-index:2147483646;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;pointer-events:none;
        border:3px solid rgba(37,99,235,.8);animation:__r .5s ease-out forwards}
      @keyframes __r{to{transform:scale(4);opacity:0}}
      #__cap{position:fixed;z-index:2147483647;left:50%;bottom:14px;transform:translateX(-50%);max-width:88%;padding:10px 18px;
        background:rgba(15,23,42,.92);color:#fff;font:600 18px/1.35 system-ui,sans-serif;border-radius:10px;text-align:center;
        box-shadow:0 4px 18px rgba(0,0,0,.35);transition:opacity .25s}\`;
    document.head.appendChild(style);
    const cur = document.createElement("div"); cur.id = "__cursor"; cur.style.left = "-50px"; cur.style.top = "-50px"; document.body.appendChild(cur);
    const cap = document.createElement("div"); cap.id = "__cap"; cap.style.opacity = 0; document.body.appendChild(cap);
    addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", (e) => { const r = document.createElement("div"); r.className = "__ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); cur.style.transform = "scale(.8)"; }, true);
    addEventListener("mouseup", () => { cur.style.transform = ""; }, true);
  };
  if (document.body) mk(); else addEventListener("DOMContentLoaded", mk);
  window.__caption = (t) => { mk(); const c = document.getElementById("__cap"); c.style.opacity = t ? 1 : 0; if (t) c.textContent = t; };
})();`;

async function newRecording(browser, name, size = SIZE) {
  const dir = join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: size, recordVideo: { dir, size } });
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  return { ctx, page, dir };
}

const cap = (page, text) => page.evaluate((t) => window.__caption && window.__caption(t), text);

async function glide(page, box, steps = 18) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}

async function click(page, selectorOrLocator) {
  const loc = typeof selectorOrLocator === "string" ? page.locator(selectorOrLocator).first() : selectorOrLocator;
  await loc.scrollIntoViewIfNeeded();
  const box = await loc.boundingBox();
  await glide(page, box);
  await sleep(180);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(250);
}

async function typeInto(page, selector, text) {
  const loc = page.locator(selector).first();
  await click(page, loc);
  await page.keyboard.type(text, { delay: 70 });
}

/** Replaces `find` inside a textarea by typing `replacement`, so viewers see the edit happen. */
async function edit(page, selector, find, replacement) {
  const box = await page.locator(selector).first().boundingBox();
  await glide(page, box, 10);
  const ok = await page.evaluate(({ selector, find }) => {
    const ta = document.querySelector(selector); const i = ta.value.indexOf(find);
    if (i < 0) return false;
    ta.focus(); ta.setSelectionRange(i, i + find.length);
    const before = ta.value.slice(0, i); ta.scrollTop = Math.max(0, (before.split("\\n").length - 6) * 18);
    return true;
  }, { selector, find });
  if (!ok) throw new Error(`"${find}" not found in ${selector}`);
  await sleep(500);
  await page.keyboard.type(replacement, { delay: 90 });
}

async function finish(name, ctx, page, dir, tail = 900) {
  await sleep(tail);
  await ctx.close();
  const webm = readdirSync(dir).find((f) => f.endsWith(".webm"));
  const src = join(dir, webm);
  mkdirSync(OUT, { recursive: true });
  const mp4 = join(OUT, `${name}.mp4`);
  const gif = join(OUT, `${name}.gif`);
  const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args]);
  ff(["-i", src, "-vf", "fps=20,scale=1100:-2:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  ff(["-i", src, "-vf", "fps=8,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle", "-loop", "0", gif]);
  ff(["-ss", "2", "-i", mp4, "-frames:v", "1", join(OUT, `${name}.jpg`)]);
  console.log(`✓ ${name}`);
}

// ---------------------------------------------------------------------------

const demos = {
  async charts(browser) {
    const { ctx, page, dir } = await newRecording(browser, "charts");
    await page.goto(REACT);
    await page.waitForSelector("[data-genui-type=page]");
    await cap(page, "A GenUI document describes the dashboard. The numbers live in a data model.");
    await sleep(2600);
    await cap(page, "Tabs, KPIs and charts are components. This is a line chart…");
    await sleep(1800);
    await click(page, "button[role=tab]:has-text('Sources')");
    await cap(page, "…the same document renders a pie chart from different data…");
    await sleep(2400);
    await click(page, "button[role=tab]:has-text('Recent')");
    await cap(page, "…and a table.");
    await sleep(2000);
    await click(page, "button[role=tab]:has-text('Traffic')");
    await cap(page, "An agent can stream new data. The chart and KPI update in place.");
    await click(page, "button:has-text('Play stream')");
    await sleep(4200);
    await cap(page, "Bindings keep everything in sync: change the range and the title follows.");
    await page.locator("select").nth(0).scrollIntoViewIfNeeded();
    const sel = page.locator("[data-genui-type=select] select");
    await glide(page, await sel.boundingBox());
    await sel.selectOption("30d");
    await sleep(2400);
    await cap(page, "");
    await finish("charts", ctx, page, dir);
  },

  async cards(browser) {
    const { ctx, page, dir } = await newRecording(browser, "cards-forms");
    await page.goto(REACT);
    await page.waitForSelector("[data-genui-type=page]");
    await click(page, "button:has-text('Access request workflow')");
    await cap(page, "Cards, inputs and a workflow, all described as JSON.");
    await sleep(2200);
    await typeInto(page, "[data-genui-type=input] input", "Ada Lovelace");
    await click(page, "[data-genui-type=textarea] textarea");
    await page.keyboard.type("Need billing access for the Q3 close", { delay: 45 });
    await click(page, "[data-genui-type=checkbox] input");
    await cap(page, "Fields are bound to the data model: typing updates it live.");
    await sleep(1800);
    await cap(page, "Submit sends the form data to the agent as an event…");
    await click(page, "button[data-genui-type=button]");
    await sleep(2300);
    await cap(page, "…and the agent answers with data patches. The workflow advances.");
    await sleep(3200);
    await cap(page, "");
    await finish("cards-forms", ctx, page, dir);
  },

  async monitor(browser) {
    const { ctx, page, dir } = await newRecording(browser, "agent-monitor");
    await page.goto(REACT);
    await page.waitForSelector("[data-genui-type=page]");
    await click(page, "button:has-text('Agent run monitor')");
    await cap(page, "An agent run: execution graph, counters and a timeline.");
    await sleep(2800);
    await cap(page, "Frames stream in order. Each one is a small, atomic patch.");
    await click(page, "button:has-text('Play stream')");
    await sleep(6200);
    await cap(page, "Nothing was regenerated: the UI was updated, not rebuilt.");
    await sleep(2600);
    await cap(page, "");
    await finish("agent-monitor", ctx, page, dir);
  },

  async json(browser) {
    // The playground: JSON on the left, live render on the right. Focus on charts and graphs.
    const { ctx, page, dir } = await newRecording(browser, "json-to-ui");
    const TA = "textarea[aria-label='Document JSON']";
    await page.goto(PLAY);
    await page.waitForSelector("[data-genui-type=page]");
    await cap(page, "The playground: the JSON on the left is the whole UI. It renders live on the right.");
    await sleep(3000);
    await cap(page, "This chart is a bar chart. Change one word in the JSON…");
    await edit(page, TA, '"type": "bar"', '"type": "line"');
    await sleep(2400);
    await cap(page, "…and it is a line chart. Same data, different component props.");
    await sleep(1800);
    await edit(page, TA, '"type": "line"', '"type": "pie"');
    await cap(page, "…or a pie chart.");
    await sleep(2600);
    await edit(page, TA, '"type": "pie"', '"type": "bar"');
    await sleep(1400);
    await cap(page, "Charts read from the data model. Change a value and the bar moves.");
    await edit(page, TA, '"value": 140', '"value": 260');
    await sleep(2600);
    await cap(page, "KPI cards follow the data too.");
    await edit(page, TA, '12,847', '15,320');
    await sleep(2200);
    await cap(page, "Mistakes are caught by the validator, with a precise message.");
    await edit(page, TA, '"t": "chart"', '"t": "charts"');
    await sleep(3200);
    await cap(page, "Fix it and the chart is back.");
    await edit(page, TA, '"t": "charts"', '"t": "chart"');
    await sleep(2200);
    await cap(page, "Other examples: an agent run, drawn as an execution graph and a timeline.");
    await click(page, "select >> nth=0");
    await page.locator("select").first().selectOption({ label: "Agent run (workflow + timeline)" });
    await sleep(4200);
    await cap(page, "");
    await finish("json-to-ui", ctx, page, dir);
  },

  async renderers(browser) {
    const size = { width: 1500, height: 720 };
    const { ctx, page, dir } = await newRecording(browser, "two-renderers", size);
    const html = `<!doctype html><meta charset=utf-8><style>
      body{margin:0;background:#0f172a;font-family:system-ui,sans-serif;color:#fff}
      .row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:10px 12px 0}
      .pane{background:#fff;border-radius:10px;overflow:hidden;height:610px;position:relative}
      .pane h2{position:absolute;z-index:3;margin:0;top:8px;right:10px;font:700 14px system-ui;background:#0f172a;color:#fff;padding:4px 10px;border-radius:999px}
      iframe{border:0;transform-origin:0 0;position:absolute;left:0;top:0}
      #l iframe{width:1250px;height:1020px;transform:scale(.6)} #r iframe{width:1300px;height:1020px;transform:scale(.576)}</style>
      <div class=row><div class=pane id=l><h2>React</h2><iframe src="${REACT}"></iframe></div>
      <div class=pane id=r><h2>Angular</h2><iframe src="${NG}"></iframe></div></div>`;
    writeFileSync(join(TMP, "side.html"), html);
    await page.goto("file://" + join(TMP, "side.html"));
    const [left, right] = page.frames().filter((f) => f !== page.mainFrame());
    await left.waitForSelector("[data-genui-type=page]");
    await right.waitForSelector("genui-dynamic-renderer");
    // The Angular header overflows when scaled down, so press its buttons programmatically.
    const press = (text) => right.evaluate((t) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().includes(t)).click(), text);
    await press("Analytics");
    await cap(page, "One GenUI document, two renderers: React on the left, Angular on the right.");
    await sleep(3200);
    await cap(page, "Same components, same data, same behaviour. Only the renderer differs.");
    await sleep(2600);
    await cap(page, "A live stream updates both at once.");
    await left.click("button:has-text('Play stream')");
    await press("Stream");
    await sleep(4600);
    await cap(page, "");
    await finish("two-renderers", ctx, page, dir);
  },
};

(async () => {
  const wanted = process.argv.slice(2);
  const names = wanted.length ? wanted : Object.keys(demos);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
  for (const n of names) {
    if (!demos[n]) throw new Error(`unknown demo "${n}" (have: ${Object.keys(demos).join(", ")})`);
    await demos[n](browser);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
