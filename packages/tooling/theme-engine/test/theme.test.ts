import { describe, expect, it } from "vitest";
import { autoThemeCss, createTheme, darkTheme, lightTheme, themeToCss, themeToCssVars, tokenToCssVar } from "../src/index";

describe("theme-engine", () => {
    it("maps token names to css variables", () => {
        expect(tokenToCssVar("color.primary")).toBe("--genui-color-primary");
        expect(tokenToCssVar("color.primaryText")).toBe("--genui-color-primary-text");
        expect(tokenToCssVar("font.size.lg")).toBe("--genui-font-size-lg");
    });

    it("light and dark define the same tokens", () => {
        expect(Object.keys(darkTheme.tokens).sort()).toEqual(Object.keys(lightTheme.tokens).sort());
    });

    it("overrides on top of a base theme", () => {
        const t = createTheme("brand", { "color.primary": "#ff0066" }, darkTheme);
        expect(t.tokens["color.primary"]).toBe("#ff0066");
        expect(t.tokens["color.background"]).toBe(darkTheme.tokens["color.background"]);
    });

    it("rejects css injection through token names or values", () => {
        expect(() => createTheme("x", { "color.primary": "red; } body { display:none" })).toThrow();
        expect(() => createTheme("x", { "color.primary": "url(https://evil/x.png)" })).toThrow();
        expect(() => createTheme("x", { "bad name": "red" })).toThrow();
        // themes assembled by hand are filtered at output time
        const vars = themeToCssVars({ name: "raw", tokens: { "color.a": "red", "color.b": "red;}", "x y": "1" } });
        expect(vars).toEqual({ "--genui-color-a": "red" });
    });

    it("emits css", () => {
        expect(themeToCss(createTheme("t", {}), ":root")).toContain("--genui-color-primary: #2563eb;");
        const auto = autoThemeCss();
        expect(auto).toContain("prefers-color-scheme: dark");
        expect(auto).toContain('[data-genui-theme="dark"]');
    });
});
