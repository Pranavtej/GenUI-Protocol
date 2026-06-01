export class EventRouter {
    subscriptions = new Set();
    globalListeners = new Set();
    subscribe(eventType, handler, useCapture = false) {
        const sub = { eventType, handler, useCapture };
        this.subscriptions.add(sub);
        return () => {
            this.subscriptions.delete(sub);
        };
    }
    // Add a global listener to intercept all serializable events (useful for MCP and AI agents)
    subscribeGlobal(listener) {
        this.globalListeners.add(listener);
        return () => {
            this.globalListeners.delete(listener);
        };
    }
    // Dispatches an event starting from target ID and bubbling up the tree structure if node provider is available
    async dispatch(eventInput, nodeResolver) {
        const event = {
            bubbles: true,
            ...eventInput,
            timestamp: eventInput.timestamp || new Date().toISOString(),
            cancelled: false
        };
        // Notify global listeners first (for tools/MCP tracking)
        this.globalListeners.forEach((listener) => {
            try {
                listener(event);
            }
            catch (e) {
                console.error("Error in global event listener:", e);
            }
        });
        // Resolve propagation path
        const path = [event.target];
        if (nodeResolver) {
            let currentId = event.target;
            let current = nodeResolver(currentId);
            while (current && current.parentId) {
                path.push(current.parentId);
                current = nodeResolver(current.parentId);
            }
        }
        // 1. Capture Phase (Root to Target)
        if (event.bubbles) {
            for (let i = path.length - 1; i >= 0; i--) {
                if (event.cancelled)
                    break;
                const nodeId = path[i];
                await this.triggerHandlers(event, nodeId, true);
            }
        }
        // 2. Bubble Phase (Target to Root)
        for (let i = 0; i < path.length; i++) {
            if (event.cancelled)
                break;
            const nodeId = path[i];
            await this.triggerHandlers(event, nodeId, false);
            if (!event.bubbles)
                break; // If bubbles is false, only trigger target node
        }
        return event;
    }
    async triggerHandlers(event, nodeId, isCapture) {
        // Trigger specific event type handlers
        const matchingSubs = Array.from(this.subscriptions).filter((sub) => (sub.eventType === event.type || sub.eventType === "*") &&
            sub.useCapture === isCapture);
        for (const sub of matchingSubs) {
            try {
                await sub.handler({
                    ...event,
                    // If target doesn't match node being processed, let handler know context if needed
                    payload: {
                        ...event.payload,
                        currentNodeId: nodeId
                    }
                });
            }
            catch (e) {
                console.error(`Error in event handler for ${event.type} on node ${nodeId}:`, e);
            }
        }
    }
}
export const eventRouter = new EventRouter();
//# sourceMappingURL=index.js.map