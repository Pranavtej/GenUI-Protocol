import type { DocsThemeConfig } from 'nextra-theme-docs';
import { useRouter } from 'next/router';

const config: DocsThemeConfig = {
    logo: <span className="font-semibold">GenUI Protocol</span>,
    project: {
        link: 'https://github.com/Pranavtej/GenUI-Protocol'
    },
    chat: {
        link: 'https://github.com/Pranavtej/GenUI-Protocol/discussions'
    },
    docsRepositoryBase: 'https://github.com/Pranavtej/GenUI-Protocol/tree/demo/apps/docs',
    footer: {
        text: '© 2026 GenUI Protocol'
    },
    useNextSeoProps() {
        const { asPath } = useRouter();
        return {
            titleTemplate: asPath === '/' ? '%s' : '%s – GenUI Protocol Docs'
        };
    },
    head: () => (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="Documentation for GenUI Protocol and AI-native UI runtime." />
            <meta name="og:title" content="GenUI Protocol Docs" />
            <meta name="og:description" content="Documentation for GenUI Protocol and AI-native UI runtime." />
            <link rel="icon" href="/favicon.ico" />
        </>
    ),
    sidebar: {
        defaultMenuCollapseLevel: 1,
        titleComponent({ title, type }) {
            if (type === 'separator') return <span className="cursor-default">{title}</span>;
            return <>{title}</>;
        }
    },
    toc: {
        float: true,
        title: 'On this page'
    },
    navbar: {
        extraContent: <></>
    },
    primaryHue: 220,
    primarySaturation: 80,
    feedback: { content: null },
    editLink: {
        text: 'Edit this page',
        component: ({ children, className, filePath }) => (
            <a className={className} href={`https://github.com/Pranavtej/GenUI-Protocol/edit/demo/${filePath}`}> {children}</a>
        )
    }
};

export default config;
