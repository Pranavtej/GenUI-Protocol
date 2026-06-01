import React from "react";
import Layout from "@theme/Layout";

export default function Home() {
    return (
        <Layout title="AI-Native UI Runtime" description="Universal AST protocol for AI-generated interfaces">
            <main style={{ padding: "4rem 2rem" }}>
                <h1>AI-Native UI Runtime</h1>
                <p>A universal protocol for AI-generated, framework-agnostic user interfaces.</p>
                <section>
                    <h2>Getting Started</h2>
                    <p>Use the monorepo to explore AST design, runtime architecture, MCP server integration, and renderer adapters.</p>
                </section>
            </main>
        </Layout>
    );
}
