// RFC 6901 JSON Pointer helpers.

export const escapePointerToken = (token: string): string => token.replace(/~/g, "~0").replace(/\//g, "~1");

export const unescapePointerToken = (token: string): string => token.replace(/~1/g, "/").replace(/~0/g, "~");

export const parsePointer = (pointer: string): string[] => {
    if (pointer === "" || pointer === "/") return [];
    if (!pointer.startsWith("/")) {
        throw new Error(`Invalid JSON Pointer "${pointer}": must be empty or start with "/"`);
    }
    return pointer.slice(1).split("/").map(unescapePointerToken);
};

export const buildPointer = (tokens: Array<string | number>): string =>
    tokens.map((t) => `/${escapePointerToken(String(t))}`).join("");
