import { createContext, useContext, useSyncExternalStore } from "react";
import type { RuntimeSession } from "@genui-protocol/runtime-core";

export const SessionContext = createContext<RuntimeSession | null>(null);

export const useSession = (): RuntimeSession => {
    const session = useContext(SessionContext);
    if (!session) throw new Error("GenUI components must be rendered inside <GenUiRenderer>");
    return session;
};

/** Re-renders the caller whenever the session's tree or data changes. */
export const useSessionVersion = (session: RuntimeSession): number =>
    useSyncExternalStore(
        (cb) => session.subscribe(cb),
        () => session.version,
        () => session.version
    );
