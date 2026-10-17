import { Component, createContext, useContext, useMemo, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import type { RuntimeNode, RuntimeSession } from "@genui-protocol/runtime-core";
import { darkTheme, lightTheme, themeToCssVars, type ThemeDefinition } from "@genui-protocol/theme-engine";
import { defaultComponents, type ComponentProps } from "./components.js";
import { SessionContext, useSession, useSessionVersion } from "./context.js";

export type ComponentMap = Record<string, ComponentType<ComponentProps>>;


const Registry = createContext<ComponentMap>(defaultComponents as unknown as ComponentMap);

class NodeBoundary extends Component<{ node: RuntimeNode; onError?: (e: Error, node: RuntimeNode) => void; children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(error: Error, _info: ErrorInfo) {
        this.props.onError?.(error, this.props.node);
    }
    componentDidUpdate(prev: { node: RuntimeNode }) {
        if (this.state.failed && prev.node !== this.props.node) this.setState({ failed: false });
    }
    render() {
        if (this.state.failed) {
            return <div role="alert" data-genui-error={this.props.node.t} data-genui-id={this.props.node.id}>Failed to render “{this.props.node.t}”</div>;
        }
        return this.props.children;
    }
}

const OnErrorContext = createContext<((e: Error, node: RuntimeNode) => void) | undefined>(undefined);
const OnUnknownContext = createContext<((node: RuntimeNode) => void) | undefined>(undefined);

/** Renders one runtime node (and, recursively, its children). */
export const GenUiNode = ({ node }: { node: RuntimeNode }) => {
    const session = useSession();
    const registry = useContext(Registry);
    const onError = useContext(OnErrorContext);
    const onUnknown = useContext(OnUnknownContext);
    useSessionVersion(session);

    const props = session.resolveProps(node);
    const kids = node.children?.map((child) => <GenUiNode key={child.id} node={child} />);
    const Impl = Object.prototype.hasOwnProperty.call(registry, node.t) ? registry[node.t] : undefined;

    if (!Impl) {
        // Unknown component: never crash — show a marker and still render the children (spec §3).
        onUnknown?.(node);
        return (
            <div data-genui-unknown={node.t} data-genui-id={node.id} style={{ border: "1px dashed var(--genui-color-danger)", padding: 8, borderRadius: 6 }}>
                <small>Unknown component “{node.t}”</small>
                {kids}
            </div>
        );
    }

    return (
        <NodeBoundary node={node} onError={onError}>
            <Impl node={node} props={props} session={session}>{kids}</Impl>
        </NodeBoundary>
    );
};

export type GenUiRendererProps = {
    session: RuntimeSession;
    /** Extra or overriding components by type (e.g. `"acme:gauge"`). */
    components?: ComponentMap;
    theme?: ThemeDefinition | "light" | "dark";
    onError?: (error: Error, node: RuntimeNode) => void;
    onUnknownComponent?: (node: RuntimeNode) => void;
    className?: string;
};

/** Draws the session's current tree and keeps it in sync with tree/data changes. */
export const GenUiRenderer = ({ session, components, theme = "light", onError, onUnknownComponent, className }: GenUiRendererProps) => {
    useSessionVersion(session);
    const registry = useMemo(() => ({ ...(defaultComponents as unknown as ComponentMap), ...components }), [components]);
    const themeDef = theme === "light" ? lightTheme : theme === "dark" ? darkTheme : theme;
    const cssVars = useMemo(() => themeToCssVars(themeDef), [themeDef]);
    const tree = session.tree;

    return (
        <SessionContext.Provider value={session}>
            <Registry.Provider value={registry}>
                <OnErrorContext.Provider value={onError}>
                    <OnUnknownContext.Provider value={onUnknownComponent}>
                        <div className={className ?? "genui-root"} data-genui-theme={themeDef.name} style={{ ...cssVars, fontFamily: "var(--genui-font-family)", color: "var(--genui-color-text)" }}>
                            {tree ? <GenUiNode node={tree.root} /> : null}
                        </div>
                    </OnUnknownContext.Provider>
                </OnErrorContext.Provider>
            </Registry.Provider>
        </SessionContext.Provider>
    );
};
