import type { Config } from "./config.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 } as const;

export type Logger = {
    debug: (msg: string, fields?: Record<string, unknown>) => void;
    info: (msg: string, fields?: Record<string, unknown>) => void;
    warn: (msg: string, fields?: Record<string, unknown>) => void;
    error: (msg: string, fields?: Record<string, unknown>) => void;
};

/** JSON-lines logger. Writes to stderr so it never corrupts the MCP stdio transport on stdout. */
export const createLogger = (level: Config["logLevel"], write: (line: string) => void = (l) => process.stderr.write(l + "\n")): Logger => {
    const threshold = LEVELS[level];
    const log = (lvl: keyof typeof LEVELS) => (msg: string, fields: Record<string, unknown> = {}) => {
        if (LEVELS[lvl] < threshold) return;
        write(JSON.stringify({ time: new Date().toISOString(), level: lvl, msg, ...fields }));
    };
    return { debug: log("debug"), info: log("info"), warn: log("warn"), error: log("error") };
};
