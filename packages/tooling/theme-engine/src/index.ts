export type ThemeTokens = Record<string, string>;

export type ThemeDefinition = {
    name: string;
    tokens: ThemeTokens;
};

/**
 * Design tokens are flat dotted names (`color.primary`) mapped to CSS values. Renderers expose them as
 * CSS custom properties (`--genui-color-primary`), so any framework can style itself from the same theme.
 */
export const lightTheme: ThemeDefinition = {
    name: "light",
    tokens: {
        "color.background": "#ffffff",
        "color.surface": "#f8fafc",
        "color.surfaceAlt": "#f1f5f9",
        "color.text": "#0f172a",
        "color.textMuted": "#64748b",
        "color.border": "#e2e8f0",
        "color.primary": "#2563eb",
        "color.primaryText": "#ffffff",
        "color.success": "#16a34a",
        "color.warning": "#d97706",
        "color.danger": "#dc2626",
        "font.family": "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        "font.size.xs": "12px",
        "font.size.sm": "14px",
        "font.size.base": "16px",
        "font.size.lg": "18px",
        "font.size.xl": "24px",
        "space.sm": "8px",
        "space.md": "16px",
        "space.lg": "24px",
        "radius.md": "8px",
        "shadow.card": "0 1px 3px rgba(15, 23, 42, 0.1)",
    },
};

export const darkTheme: ThemeDefinition = {
    name: "dark",
    tokens: {
        ...lightTheme.tokens,
        "color.background": "#0b1220",
        "color.surface": "#111827",
        "color.surfaceAlt": "#1f2937",
        "color.text": "#f8fafc",
        "color.textMuted": "#94a3b8",
        "color.border": "#1f2a3d",
        "color.primary": "#60a5fa",
        "color.primaryText": "#0b1220",
        "color.success": "#4ade80",
        "color.warning": "#fbbf24",
        "color.danger": "#f87171",
        "shadow.card": "0 1px 3px rgba(0, 0, 0, 0.5)",
    },
};

const TOKEN_NAME = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*$/;
// Values are interpolated into a stylesheet / style attribute, so anything that could end the declaration,
// open a block, import a resource or run script is rejected.
const UNSAFE_VALUE = /[;{}<>\\]|url\s*\(|@import|expression\s*\(|javascript:|\/\*/i;

export const isValidTokenName = (name: string): boolean => TOKEN_NAME.test(name);
export const isSafeTokenValue = (value: string): boolean => typeof value === "string" && value.length <= 200 && !UNSAFE_VALUE.test(value);

/** `color.primaryText` -> `--genui-color-primary-text`. */
export const tokenToCssVar = (token: string, prefix = "--genui-"): string =>
    prefix + token.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/\./g, "-").toLowerCase();

/** Creates a theme from a base plus overrides. Invalid token names or unsafe values throw. */
export const createTheme = (name: string, overrides: Partial<ThemeTokens> = {}, base: ThemeDefinition = lightTheme): ThemeDefinition => {
    const tokens: ThemeTokens = { ...base.tokens };
    for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) continue;
        if (!isValidTokenName(key)) throw new Error(`Invalid theme token name "${key}"`);
        if (!isSafeTokenValue(value)) throw new Error(`Unsafe value for theme token "${key}"`);
        tokens[key] = value;
    }
    return { name, tokens };
};

/** Theme tokens as a `{ '--genui-color-primary': '#2563eb' }` map (e.g. for a React style prop). */
export const themeToCssVars = (theme: ThemeDefinition, prefix = "--genui-"): Record<string, string> => {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(theme.tokens)) {
        if (isValidTokenName(key) && isSafeTokenValue(value)) vars[tokenToCssVar(key, prefix)] = value;
    }
    return vars;
};

/** Theme as a CSS rule: `:root { --genui-... }`. */
export const themeToCss = (theme: ThemeDefinition, selector = ":root", prefix = "--genui-"): string => {
    const body = Object.entries(themeToCssVars(theme, prefix)).map(([k, v]) => `  ${k}: ${v};`).join("\n");
    return `${selector} {\n${body}\n}`;
};

/** Light theme on `:root`, dark theme under `prefers-color-scheme` and `[data-genui-theme="dark"]`. */
export const autoThemeCss = (light: ThemeDefinition = lightTheme, dark: ThemeDefinition = darkTheme): string =>
    [
        themeToCss(light, ":root"),
        `@media (prefers-color-scheme: dark) {\n${themeToCss(dark, ":root:not([data-genui-theme=\"light\"])")}\n}`,
        themeToCss(dark, ":root[data-genui-theme=\"dark\"]"),
    ].join("\n");
