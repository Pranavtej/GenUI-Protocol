import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenUiRenderer, createSession, type ComponentProps } from "../src/index";

afterEach(cleanup);

const fixtures = JSON.parse(readFileSync(join(__dirname, "../../../../conformance/render.json"), "utf8"));

describe("conformance/render.json", () => {
    for (const c of fixtures.cases) {
        it(c.name, () => {
            const unknown: string[] = [];
            const session = createSession({ document: c.document });
            const { container } = render(<GenUiRenderer session={session} onUnknownComponent={(n) => unknown.push(n.t)} />);
            const text = container.textContent ?? "";

            if (c.expect.types) {
                const rendered = Array.from(container.querySelectorAll("[data-genui-type]")).map((e) => e.getAttribute("data-genui-type"));
                expect(rendered).toEqual(c.expect.types);
            }
            for (const t of c.expect.text ?? []) expect(text).toContain(t);
            for (const t of c.expect.absentText ?? []) expect(text).not.toContain(t);
            for (const t of c.expect.unknown ?? []) {
                expect(container.querySelector(`[data-genui-unknown="${t}"]`)).not.toBeNull();
                expect(unknown).toContain(t);
            }
            for (const el of c.expect.noElements ?? []) expect(container.querySelector(el)).toBeNull();
        });
    }
});

describe("interaction", () => {
    const doc = {
        version: "1.0.0",
        data: { form: { name: "", agree: false }, count: 0, open: true },
        root: {
            t: "page", p: { title: "Form" },
            c: [
                { t: "input", id: "name", p: { label: "Name", value: { $bind: "form.name" } } },
                { t: "checkbox", id: "agree", p: { label: "I agree", checked: { $bind: "form.agree" } } },
                { t: "text", id: "greeting", p: { content: { $tpl: "Hello {{form.name}}" } } },
                { t: "button", id: "send", p: { label: "Send", onClick: [{ do: "setData", path: "count", value: 1 }, { do: "submit", name: "signup", from: "form" }] } },
                { t: "dialog", id: "dlg", p: { title: "Notice", open: { $bind: "open" }, onClose: { do: "toggle", path: "open" } }, c: [{ t: "text", p: { content: "inside" } }] },
            ],
        },
    };

    it("two-way binds inputs, runs actions and emits events to the host", async () => {
        const onEmit = vi.fn();
        const session = createSession({ document: doc, onEmit });
        render(<GenUiRenderer session={session} />);

        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
        expect(session.data.get("form.name")).toBe("Ada");
        expect(screen.getByText("Hello Ada")).toBeTruthy();

        fireEvent.click(screen.getByLabelText("I agree"));
        expect(session.data.get("form.agree")).toBe(true);

        fireEvent.click(screen.getByText("Send"));
        await waitFor(() => expect(onEmit).toHaveBeenCalledTimes(1));
        expect(onEmit.mock.calls[0][0]).toMatchObject({ name: "signup", nodeId: "send", payload: { data: { name: "Ada", agree: true } } });
        expect(session.data.get("count")).toBe(1);

        expect(screen.getByRole("dialog")).toBeTruthy();
        fireEvent.click(screen.getByLabelText("Close"));
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("re-renders when stream frames arrive", async () => {
        const session = createSession({ document: doc });
        render(<GenUiRenderer session={session} />);
        act(() => {
            session.applyFrame({ type: "patch", patches: [{ op: "replace", path: "/p/title", value: "Updated" }] });
        });
        expect(screen.getByText("Updated")).toBeTruthy();
        act(() => {
            session.applyFrame({ type: "data", patches: [{ op: "replace", path: "/form/name", value: "Grace" }] });
        });
        expect(screen.getByText("Hello Grace")).toBeTruthy();
        expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Grace");
    });

    it("renders custom components and isolates crashing ones", () => {
        const Gauge = ({ props }: ComponentProps) => <div data-testid="gauge">{String(props.value)}%</div>;
        const Boom = () => {
            throw new Error("boom");
        };
        const onError = vi.fn();
        vi.spyOn(console, "error").mockImplementation(() => {});
        const session = createSession({
            document: { version: "1.0.0", root: { t: "stack", c: [{ t: "acme:gauge", p: { value: 42 } }, { t: "acme:boom" }, { t: "text", p: { content: "survivor" } }] } },
        });
        render(<GenUiRenderer session={session} components={{ "acme:gauge": Gauge, "acme:boom": Boom }} onError={onError} />);
        expect(screen.getByTestId("gauge").textContent).toBe("42%");
        expect(screen.getByText("survivor")).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toContain("acme:boom");
        expect(onError).toHaveBeenCalled();
    });

    it("does not look up inherited object keys as components", () => {
        const session = createSession({ document: { version: "1.0.0", root: { t: "constructor" } } });
        const { container } = render(<GenUiRenderer session={session} />);
        expect(container.querySelector('[data-genui-unknown="constructor"]')).not.toBeNull();
    });

    it("applies theme css variables", () => {
        const session = createSession({ document: { version: "1.0.0", root: { t: "text", p: { content: "x" } } } });
        const { container } = render(<GenUiRenderer session={session} theme="dark" />);
        const root = container.querySelector(".genui-root") as HTMLElement;
        expect(root.getAttribute("data-genui-theme")).toBe("dark");
        expect(root.style.getPropertyValue("--genui-color-background")).toBe("#0b1220");
    });
});
