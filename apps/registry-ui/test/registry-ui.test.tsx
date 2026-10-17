// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ComponentRegistry } from "@genui-protocol/component-registry";
import { GenUiRenderer, createSession } from "@genui-protocol/renderer-react";
import App from "../src/App";
import { categories, filterEntries, propRows } from "../src/lib";

afterEach(cleanup);
const entries = new ComponentRegistry().list();

describe("lib", () => {
    it("flattens schemas into prop rows", () => {
        const rows = propRows(entries.find((e) => e.id === "button")!.schema);
        expect(rows.find((r) => r.name === "label")).toMatchObject({ type: "string", required: true });
        expect(rows.find((r) => r.name === "variant")!.type).toContain('"outline"');
        expect(propRows(entries.find((e) => e.id === "table")!.schema).find((r) => r.name === "columns")!.type).toBe("object[]");
        expect(propRows(undefined)).toEqual([]);
    });

    it("filters by query and category", () => {
        expect(filterEntries(entries, "chart", null).map((e) => e.id)).toContain("chart");
        expect(filterEntries(entries, "", "forms").every((e) => e.category === "forms")).toBe(true);
        expect(filterEntries(entries, "zzzz", null)).toEqual([]);
        expect(categories(entries)).toEqual([...new Set(entries.map((e) => e.category))].sort());
    });

    it("every registry example renders without hitting the unknown-component fallback", () => {
        for (const e of entries) {
            for (const ex of e.examples ?? []) {
                const session = createSession({ document: { version: "1.0.0", root: ex } });
                const { container, unmount } = render(<GenUiRenderer session={session} />);
                expect(container.querySelector("[data-genui-unknown]"), e.id).toBeNull();
                expect(container.querySelector("[data-genui-error]"), e.id).toBeNull();
                unmount();
            }
        }
    });
});

describe("App", () => {
    it("lists components, filters and shows details with a live example", () => {
        render(<App />);
        expect(screen.getByRole("heading", { name: "Component Registry" })).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Search components"), { target: { value: "kpi" } });
        fireEvent.click(screen.getByText("kpi", { selector: "code" }));
        expect(screen.getByText("Props")).toBeTruthy();
        expect(document.querySelector('[data-genui-type="kpi"]')).not.toBeNull();
        fireEvent.change(screen.getByLabelText("Search components"), { target: { value: "zzzz" } });
        expect(screen.getByText("No matches.")).toBeTruthy();
    });
});
