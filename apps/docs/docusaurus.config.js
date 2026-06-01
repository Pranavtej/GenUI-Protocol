const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

module.exports = {
    title: "AI-Native UI Runtime",
    tagline: "Universal AST protocol for AI-generated interfaces",
    url: "https://example.com",
    baseUrl: "/",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/favicon.ico",
    organizationName: "ainativeui",
    projectName: "ai-native-ui",
    presets: [
        [
            "@docusaurus/preset-classic",
            {
                docs: {
                    routeBasePath: "/",
                    sidebarPath: require.resolve("./sidebars.js")
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css")
                }
            }
        ]
    ],
    themeConfig: {
        navbar: {
            title: "AI-Native UI",
            items: [
                { to: "/", label: "Docs", position: "left" },
                { href: "https://github.com/Pranavtej/GenUI-Protocol", label: "GitHub", position: "right" }
            ]
        },
        prism: {
            theme: lightCodeTheme,
            darkTheme: darkCodeTheme
        }
    }
};
