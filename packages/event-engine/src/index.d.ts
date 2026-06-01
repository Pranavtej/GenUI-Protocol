export type UIEvent = {
    type: string;
    target: string;
    timestamp: string;
    payload?: Record<string, unknown>;
    bubbles?: boolean;
    cancelled?: boolean;
};
export type EventHandler = (event: UIEvent) => Promise<void> | void;
export type EventSubscription = {
    eventType: string;
    handler: EventHandler;
    useCapture?: boolean;
};
export declare class EventRouter {
    private subscriptions;
    private globalListeners;
    subscribe(eventType: string, handler: EventHandler, useCapture?: boolean): () => void;
    subscribeGlobal(listener: (event: UIEvent) => void): () => void;
    dispatch(eventInput: Omit<UIEvent, "timestamp" | "cancelled"> & {
        timestamp?: string;
    }, nodeResolver?: (id: string) => {
        parentId?: string;
    } | null): Promise<UIEvent>;
    private triggerHandlers;
}
export declare const eventRouter: EventRouter;
//# sourceMappingURL=index.d.ts.map