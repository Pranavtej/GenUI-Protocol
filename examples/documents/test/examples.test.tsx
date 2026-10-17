// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GenUiRenderer } from "@genui-protocol/renderer-react";
import { createSession, type AgentEvent } from "@genui-protocol/runtime-core";
import { validateDocument } from "@genui-protocol/validation";
import { EXAMPLE_LIST, EXAMPLES } from "../src/index";

afterEach(cleanup);

describe("examples", () => {
    for (const ex of EXAMPLE_LIST) {
        it(`${ex.id}: valid document, valid live frames, renders without fallbacks`, () => {
            expect(validateDocument(ex.document)).toEqual({ valid: true });
            const session = createSession({ document: ex.document });
            const { container } = render(<GenUiRenderer session={session} />);
            expect(container.querySelector("[data-genui-unknown],[data-genui-error]")).toBeNull();
            // every live frame applies cleanly, in order
            ex.live?.forEach((frame, i) => {
                expect(frame.sequence, `${ex.id} frame ${i}`).toBe(i + 2);
                act(() => expect(session.applyFrame(frame)).toEqual({ ok: true }));
            });
        });
    }
});

describe("agent-monitoring", () => {
    it("streams to a finished state", () => {
        const ex = EXAMPLES["agent-monitoring"];
        const session = createSession({ document: ex.document });
        render(<GenUiRenderer session={session} />);
        expect(screen.getByText("Run 482 — running")).toBeTruthy();
        act(() => void ex.live!.forEach((f) => session.applyFrame(f)));
        expect(screen.getByText("Run 482 — finished")).toBeTruthy();
        expect(screen.getByText("Answer sent")).toBeTruthy();
    });
});

describe("access-request workflow (UI -> agent -> UI)", () => {
    it("submits the form, the scripted agent replies, the workflow advances", async () => {
        const ex = EXAMPLES["access-request"];
        const events: AgentEvent[] = [];
        const session = createSession({
            document: ex.document,
            onEmit: (e) => {
                events.push(e);
                for (const frame of ex.reply!(e)) session.applyFrame(frame);
            },
        });
        const { container } = render(<GenUiRenderer session={session} />);

        fireEvent.click(screen.getByText("Request access", { selector: "button" }));
        await waitFor(() => expect(screen.getByText(/Please enter your name/)).toBeTruthy()); // validation by the "agent"

        fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ada" } });
        fireEvent.click(screen.getByLabelText("I have completed security training"));
        fireEvent.click(screen.getByText("Request access", { selector: "button" }));

        await waitFor(() => expect(screen.getByText("Status: approved")).toBeTruthy());
        expect(events[1].payload).toMatchObject({ data: { name: "Ada", ack: true, system: "billing" } });
        expect(container.querySelectorAll('[data-status="completed"]').length).toBe(3);
    });
});

describe("analytics dashboard", () => {
    it("range changes the title; the export dialog emits and closes", async () => {
        const ex = EXAMPLES["analytics-dashboard"];
        const events: AgentEvent[] = [];
        const session = createSession({ document: ex.document, onEmit: (e) => void events.push(e) });
        render(<GenUiRenderer session={session} />);
        expect(screen.getByText("Analytics — 7d")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Range"), { target: { value: "30d" } });
        expect(screen.getByText("Analytics — 30d")).toBeTruthy();

        fireEvent.click(screen.getByText("Export…"));
        fireEvent.click(await screen.findByText("Email me a PDF"));
        await waitFor(() => expect(events).toHaveLength(1));
        expect(events[0]).toMatchObject({ name: "export_report", payload: { format: "pdf" } });
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
});
