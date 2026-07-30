'use client';

import { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'default'
});

export function Mermaid({ chart }: { chart: string }) {
    const id = useId();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const render = async () => {
            if (!containerRef.current) return;
            try {
                const { svg } = await mermaid.render(`mermaid-${id}`, chart);
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            } catch (error) {
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<pre class="text-sm text-red-600">${String(error)}</pre>`;
                }
            }
        };

        render();
    }, [chart, id]);

    return <div ref={containerRef} className="my-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" />;
}
