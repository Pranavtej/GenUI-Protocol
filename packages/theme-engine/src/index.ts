export type ThemeTokens = Record<string, string>;

export type ThemeDefinition = {
    name: string;
    tokens: ThemeTokens;
};

export const lightTheme: ThemeDefinition = {
    name: "light",
    tokens: {
        "color.primary": "#0066ff",
        "color.background": "#ffffff",
        "color.text": "#0f172a",
        "color.surface": "#f8fafc",
        "border.radius": "8px"
    }
};

export const darkTheme: ThemeDefinition = {
    name: "dark",
    tokens: {
        "color.primary": "#60a5fa",
        "color.background": "#0f172a",
        "color.text": "#f8fafc",
        "color.surface": "#111827",
        "border.radius": "8px"
    }
};

export const createTheme = (name: string, overrides: Partial<ThemeTokens>): ThemeDefinition => {
    const tokens: ThemeTokens = { ...lightTheme.tokens };
    Object.entries(overrides).forEach(([key, value]) => {
        if (value !== undefined) {
            tokens[key] = value;
        }
    });
    return { name, tokens };
};
