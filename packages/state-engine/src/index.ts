let activeEffect: (() => void) | null = null;
const runningComputeds = new Set<() => void>();

export type Signal<T> = {
    get: () => T;
    set: (value: T) => void;
    subscribe: (listener: (value: T) => void) => () => void;
};

export type Computed<T> = {
    get: () => T;
    subscribe: (listener: (value: T) => void) => () => void;
};

export const createSignal = <T>(initialValue: T): Signal<T> => {
    let value = initialValue;
    const subscribers = new Set<() => void>();
    const externalListeners = new Set<(value: T) => void>();

    const get = () => {
        if (activeEffect) {
            subscribers.add(activeEffect);
        }
        return value;
    };

    const set = (newValue: T) => {
        if (value === newValue) return;
        value = newValue;
        
        // Notify local subscribers (effects and computeds)
        const toNotify = Array.from(subscribers);
        toNotify.forEach((sub) => sub());
        
        // Notify external subscribers (subscriptions)
        externalListeners.forEach((listener) => listener(value));
    };

    const subscribe = (listener: (value: T) => void) => {
        externalListeners.add(listener);
        listener(value);
        return () => {
            externalListeners.delete(listener);
        };
    };

    return { get, set, subscribe };
};

export const computed = <T>(fn: () => T): Computed<T> => {
    let value: T;
    let isDirty = true;
    const subscribers = new Set<() => void>();
    const externalListeners = new Set<(value: T) => void>();

    const effectRunner = () => {
        if (runningComputeds.has(effectRunner)) {
            throw new Error("Circular dependency detected in computed signal");
        }
        isDirty = true;
        subscribers.forEach((sub) => sub());
        externalListeners.forEach((listener) => listener(get()));
    };

    const get = () => {
        if (activeEffect) {
            subscribers.add(activeEffect);
        }

        if (isDirty) {
            const prevEffect = activeEffect;
            activeEffect = effectRunner;
            runningComputeds.add(effectRunner);
            try {
                value = fn();
                isDirty = false;
            } finally {
                activeEffect = prevEffect;
                runningComputeds.delete(effectRunner);
            }
        }
        return value;
    };

    const subscribe = (listener: (value: T) => void) => {
        externalListeners.add(listener);
        listener(get());
        return () => {
            externalListeners.delete(listener);
        };
    };

    return { get, subscribe };
};

export const effect = (fn: () => void | (() => void)): (() => void) => {
    let cleanup: (() => void) | void;
    
    const run = () => {
        if (cleanup) {
            try {
                cleanup();
            } catch (e) {
                console.error("Error during effect cleanup:", e);
            }
        }
        
        const prevEffect = activeEffect;
        activeEffect = run;
        try {
            cleanup = fn();
        } finally {
            activeEffect = prevEffect;
        }
    };

    run();
    
    return () => {
        if (cleanup) {
            cleanup();
        }
        activeEffect = null;
    };
};

// Store Implementation using Proxy for nested reactive objects
export type Store<T extends object> = T & {
    $set: (path: string, value: unknown) => void;
    $subscribe: (listener: (store: T) => void) => () => void;
};

export const store = <T extends object>(initialState: T): Store<T> => {
    const signalMap = new Map<string, Signal<any>>();
    const listeners = new Set<(store: T) => void>();

    const getSignal = (path: string, initialVal: any): Signal<any> => {
        if (!signalMap.has(path)) {
            signalMap.set(path, createSignal(initialVal));
        }
        return signalMap.get(path)!;
    };

    const createProxy = (target: any, path: string): any => {
        if (typeof target !== "object" || target === null) {
            return target;
        }

        return new Proxy(target, {
            get(t, prop) {
                if (typeof prop === "symbol") return Reflect.get(t, prop);
                if (prop.startsWith("$")) return undefined; // Internal API handled below

                const currentPath = path ? `${path}.${prop}` : prop;
                const value = Reflect.get(t, prop);

                if (typeof value === "object" && value !== null) {
                    return createProxy(value, currentPath);
                }

                return getSignal(currentPath, value).get();
            },
            set(t, prop, val) {
                if (typeof prop === "symbol") return Reflect.set(t, prop, val);

                const currentPath = path ? `${path}.${prop}` : prop;
                const success = Reflect.set(t, prop, val);

                if (success) {
                    getSignal(currentPath, val).set(val);
                    listeners.forEach((listener) => listener(proxyTarget));
                }
                return success;
            }
        });
    };

    const proxyTarget = createProxy(initialState, "");

    const storeObj = {
        $set(path: string, value: unknown) {
            const parts = path.split(".");
            let current: any = initialState;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!(parts[i] in current)) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            const lastKey = parts[parts.length - 1];
            current[lastKey] = value;
            getSignal(path, value).set(value);
            listeners.forEach((listener) => listener(proxyTarget));
        },
        $subscribe(listener: (store: T) => void) {
            listeners.add(listener);
            listener(proxyTarget);
            return () => listeners.delete(listener);
        }
    };

    return new Proxy(initialState, {
        get(t, prop) {
            if (prop === "$set") return storeObj.$set;
            if (prop === "$subscribe") return storeObj.$subscribe;
            return Reflect.get(proxyTarget, prop);
        },
        set(t, prop, val) {
            return Reflect.set(proxyTarget, prop, val);
        }
    }) as Store<T>;
};

// Global Store
export class GlobalStore {
    private static instance: GlobalStore;
    private state: Store<Record<string, any>>;

    private constructor() {
        this.state = store({});
    }

    public static getInstance(): GlobalStore {
        if (!GlobalStore.instance) {
            GlobalStore.instance = new GlobalStore();
        }
        return GlobalStore.instance;
    }

    public get<T>(key: string, defaultValue?: T): T {
        if (!(key in this.state)) {
            this.state.$set(key, defaultValue);
        }
        return (this.state as any)[key];
    }

    public set<T>(key: string, value: T): void {
        this.state.$set(key, value);
    }

    public subscribe(listener: (store: Record<string, any>) => void) {
        return this.state.$subscribe(listener);
    }
}

export const globalStore = GlobalStore.getInstance();

// Server/Client Sync Store for real-time bi-directional binding
export class SyncStore<T extends object> {
    private localStore: Store<T>;
    private syncCallback?: (path: string, value: any) => void;

    constructor(initialState: T) {
        this.localStore = store(initialState);
    }

    public getStore(): Store<T> {
        return this.localStore;
    }

    public registerSyncCallback(cb: (path: string, value: any) => void) {
        this.syncCallback = cb;
    }

    public updateFromServer(path: string, value: any) {
        // Silent update to avoid infinite loops
        this.localStore.$set(path, value);
    }

    public updateFromClient(path: string, value: any) {
        this.localStore.$set(path, value);
        if (this.syncCallback) {
            this.syncCallback(path, value);
        }
    }
}

