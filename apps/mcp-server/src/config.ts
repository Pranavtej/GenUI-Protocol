export type Config = {
    host: string;
    port: number;
    /** When set, every /api route except health requires `Authorization: Bearer <key>` (or `X-API-Key`). */
    apiKey?: string;
    /** Allowed CORS origins; `*` allows any. Empty = no CORS headers. */
    corsOrigins: string[];
    bodyLimit: string;
    rateLimit: { windowMs: number; max: number };
    maxSseClients: number;
    logLevel: "debug" | "info" | "warn" | "error" | "silent";
};

const int = (v: string | undefined, fallback: number): number => {
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

/** Reads configuration from environment variables (all optional). */
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => ({
    host: env.HOST || "127.0.0.1",
    port: int(env.PORT, 4000),
    apiKey: env.GENUI_API_KEY || undefined,
    corsOrigins: (env.GENUI_CORS_ORIGINS ?? "*").split(",").map((s) => s.trim()).filter(Boolean),
    bodyLimit: env.GENUI_BODY_LIMIT || "1mb",
    rateLimit: { windowMs: int(env.GENUI_RATE_WINDOW_MS, 60_000), max: int(env.GENUI_RATE_MAX, 120) },
    maxSseClients: int(env.GENUI_MAX_SSE_CLIENTS, 100),
    logLevel: (["debug", "info", "warn", "error", "silent"].includes(env.GENUI_LOG_LEVEL ?? "") ? env.GENUI_LOG_LEVEL : "info") as Config["logLevel"],
});
