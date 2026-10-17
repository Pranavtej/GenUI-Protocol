import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Server } from "node:http";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import type { ComponentRegistry } from "@genui-protocol/component-registry";
import { validateDocument } from "@genui-protocol/validation";
import { buildSystemPrompt, TOOLS } from "@genui-protocol/prompt-kit";
import { RENDERERS, TEMPLATES, assignMissingIds, astMetadata, buildTemplate, checkAst, suggestComponents } from "./core.js";
import type { Config } from "./config.js";
import type { Logger } from "./logger.js";
import type { UINode } from "@genui-protocol/ast";
import { defaultASTDocument } from "@genui-protocol/ast";

const MAX_HISTORY = 200;

const safeEqual = (a: string, b: string): boolean => {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
};

const isNode = (x: unknown): x is UINode => typeof x === "object" && x !== null && typeof (x as UINode).t === "string";

/** Builds the REST/SSE sidecar. State (SSE clients, frame history) lives in the returned app's closure. */
export const createHttpApp = (deps: { registry: ComponentRegistry; config: Config; logger: Logger }): { app: Express; listen: () => Promise<Server> } => {
    const { registry, config, logger } = deps;
    const app = express();
    app.disable("x-powered-by");

    // ---- request id + access log ---------------------------------------------------
    app.use((req, res, next) => {
        const id = randomUUID();
        res.setHeader("X-Request-Id", id);
        const start = Date.now();
        res.on("finish", () => logger.info("request", { id, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start }));
        next();
    });

    // ---- CORS ----------------------------------------------------------------------
    if (config.corsOrigins.length > 0) {
        app.use(cors({ origin: config.corsOrigins.includes("*") ? true : config.corsOrigins, allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"] }));
    }

    app.use(express.json({ limit: config.bodyLimit }));

    // ---- health (always open) ------------------------------------------------------
    app.get("/api/health", (_req, res) => void res.json({ status: "ok", mode: "http-mcp" }));
    app.get("/api/health/ready", (_req, res) => void res.json({ status: "ready", components: registry.list().length, renderers: RENDERERS.length }));

    // ---- auth ----------------------------------------------------------------------
    app.use("/api", (req: Request, res: Response, next: NextFunction) => {
        if (!config.apiKey) return next();
        const header = req.header("authorization");
        const provided = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : req.header("x-api-key") ?? "";
        if (provided && safeEqual(provided, config.apiKey)) return next();
        res.setHeader("WWW-Authenticate", "Bearer");
        res.status(401).json({ error: "unauthorized", message: "A valid API key is required." });
    });

    // ---- rate limit (fixed window per key/ip) --------------------------------------
    const windows = new Map<string, { count: number; resetAt: number }>();
    const sweep = setInterval(() => {
        const now = Date.now();
        for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }, Math.max(1000, config.rateLimit.windowMs));
    sweep.unref();
    if (config.rateLimit.max > 0) {
        app.use("/api", (req, res, next) => {
            if (req.path.startsWith("/health")) return next();
            const key = config.apiKey ? "key" : req.ip ?? "unknown";
            const now = Date.now();
            let w = windows.get(key);
            if (!w || w.resetAt <= now) {
                w = { count: 0, resetAt: now + config.rateLimit.windowMs };
                windows.set(key, w);
            }
            w.count++;
            res.setHeader("X-RateLimit-Limit", String(config.rateLimit.max));
            res.setHeader("X-RateLimit-Remaining", String(Math.max(0, config.rateLimit.max - w.count)));
            if (w.count > config.rateLimit.max) {
                res.setHeader("Retry-After", String(Math.ceil((w.resetAt - now) / 1000)));
                return void res.status(429).json({ error: "rate_limited", message: "Too many requests." });
            }
            next();
        });
    }

    // ---- read-only discovery -------------------------------------------------------
    app.get("/api/discover_components", (_req, res) => void res.json(registry.list()));

    app.get("/api/get_component", (req, res) => {
        const name = String(req.query.name || "");
        const entry = registry.get(name);
        if (!entry) return void res.status(404).json({ error: "not_found", message: `Component "${name}" not found.` });
        res.json(entry);
    });

    app.get("/api/search_components", (req, res) => void res.json(registry.search(String(req.query.q || ""))));
    app.get("/api/list_renderers", (_req, res) => void res.json(RENDERERS));

    app.get("/api/protocol_guide", (_req, res) => void res.json({ systemPrompt: buildSystemPrompt({ registry }), tools: TOOLS }));

    app.post("/api/suggest_components", (req, res) => {
        const { description } = req.body ?? {};
        if (typeof description !== "string" || !description) {
            return void res.status(400).json({ error: "missing_description", message: "Provide a 'description' field." });
        }
        res.json({ suggestions: suggestComponents(registry, description).slice(0, 10), total: registry.list().length });
    });

    // ---- generation / validation ---------------------------------------------------
    app.post("/api/generate_ast", (req, res) => {
        const root = req.body?.root;
        if (!isNode(root)) return void res.status(400).json({ error: "invalid_ast", message: "Root node must have a 't' (type) field." });
        res.json(defaultASTDocument(assignMissingIds(root)));
    });

    app.post("/api/validate_ast", (req, res) => {
        const { root, document, renderer } = req.body ?? {};
        if (root === undefined && document === undefined) return void res.status(400).json({ error: "missing_input", message: "Provide 'root' or 'document'." });
        res.json(checkAst({ root, document, renderer }));
    });

    app.post("/api/validate_document", (req, res) => {
        const { document, renderer } = req.body ?? {};
        if (document === undefined) return void res.status(400).json({ error: "missing_document" });
        res.json(validateDocument(document, renderer));
    });

    app.post("/api/normalize_ast", (req, res) => {
        const root = req.body?.root;
        if (!isNode(root)) return void res.status(400).json({ error: "missing_root" });
        res.json(assignMissingIds(root));
    });

    app.get("/api/generate_template", (req, res) => {
        const type = String(req.query.type || "dashboard");
        const doc = buildTemplate(type);
        if (!doc) return void res.status(404).json({ error: "unknown_template", available: Object.keys(TEMPLATES) });
        res.json(doc);
    });

    app.post("/api/ast_metadata", (req, res) => {
        const root = req.body?.root;
        if (!isNode(root)) return void res.status(400).json({ error: "invalid_ast" });
        res.json(astMetadata(root));
    });

    // ---- streaming (spec section 6) ------------------------------------------------
    let sseClients: Response[] = [];
    let streamSequence = 0;
    let history: Record<string, unknown>[] = []; // frames since the latest snapshot, replayed to late joiners

    const broadcast = (frame: Record<string, unknown>) => {
        if (frame.type === "snapshot") history = [frame];
        else if (history.length > 0) history.push(frame);
        if (history.length > MAX_HISTORY) history = [];
        const payload = `data: ${JSON.stringify(frame)}\n\n`;
        sseClients.forEach((client) => client.write(payload));
        return sseClients.length;
    };

    app.get("/api/stream", (req, res) => {
        if (sseClients.length >= config.maxSseClients) return void res.status(503).json({ error: "too_many_streams" });
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        sseClients.push(res);
        history.forEach((frame) => res.write(`data: ${JSON.stringify(frame)}\n\n`));
        const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25_000);
        keepAlive.unref();
        req.on("close", () => {
            clearInterval(keepAlive);
            sseClients = sseClients.filter((c) => c !== res);
        });
    });

    app.post("/api/stream_patch", (req, res) => {
        const { patches, dataPatches } = req.body ?? {};
        if (!Array.isArray(patches)) return void res.status(400).json({ error: "patches must be an array" });
        const sequence = ++streamSequence;
        const clientsNotified = broadcast({ type: "patch", sequence, patches, ...(Array.isArray(dataPatches) ? { dataPatches } : {}) });
        res.json({ status: "success", sequence, clientsNotified });
    });

    app.post("/api/stream_data", (req, res) => {
        const { patches } = req.body ?? {};
        if (!Array.isArray(patches)) return void res.status(400).json({ error: "patches must be an array" });
        const sequence = ++streamSequence;
        res.json({ status: "success", sequence, clientsNotified: broadcast({ type: "data", sequence, patches }) });
    });

    app.post("/api/stream_ast", (req, res) => {
        const document = req.body?.ast ?? req.body?.document;
        const check = validateDocument(document);
        if (!check.valid) return void res.status(400).json({ error: "invalid_ast", errors: check.errors });
        const sequence = ++streamSequence; // a snapshot starts a new baseline
        res.json({ status: "success", sequence, clientsNotified: broadcast({ type: "snapshot", sequence, document }) });
    });

    // ---- errors --------------------------------------------------------------------
    app.use("/api", (_req, res) => void res.status(404).json({ error: "not_found" }));
    app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
        if (err.type === "entity.parse.failed") return void res.status(400).json({ error: "invalid_json", message: "Request body is not valid JSON." });
        if (err.type === "entity.too.large") return void res.status(413).json({ error: "payload_too_large" });
        logger.error("unhandled", { message: err.message });
        res.status(500).json({ error: "internal_error" });
    });

    return {
        app,
        listen: (): Promise<Server> =>
            new Promise((resolve) => {
                const server = app.listen(config.port, config.host, () => resolve(server));
                server.on("close", () => clearInterval(sweep));
            }),
    };
};
