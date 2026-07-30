import { provideGuipComponent } from "./provider";
import {
    PageRenderer,
    SectionRenderer,
    CardRenderer,
    TextRenderer,
    HeadingRenderer,
    ButtonRenderer,
    InputRenderer,
    TextareaRenderer,
    SelectRenderer,
    CheckboxRenderer,
    TableRenderer,
    FlexRenderer,
    GridRenderer,
    KpiRenderer,
    DashboardRenderer,
    ChartRenderer,
    GUIP_CORE_RENDERERS
} from "./components/core-components";

export * from "./provider";
export * from "./dynamic-renderer.component";
export * from "./renderer.component";
export * from "./components/core-components";
export { provideGuipTheme, GUIP_DEFAULT_THEME_CSS, GUIP_THEME_TOKEN } from "./theme-provider";

export * from "./ui";

export function provideGuipRenderer() {
    return [
        provideGuipComponent("page", PageRenderer),
        provideGuipComponent("section", SectionRenderer),
        provideGuipComponent("card", CardRenderer),
        provideGuipComponent("text", TextRenderer),
        provideGuipComponent("heading", HeadingRenderer),
        provideGuipComponent("button", ButtonRenderer),
        provideGuipComponent("input", InputRenderer),
        provideGuipComponent("textarea", TextareaRenderer),
        provideGuipComponent("select", SelectRenderer),
        provideGuipComponent("checkbox", CheckboxRenderer),
        provideGuipComponent("table", TableRenderer),
        provideGuipComponent("grid", GridRenderer),
        provideGuipComponent("flex", FlexRenderer),
        provideGuipComponent("kpi", KpiRenderer),
        provideGuipComponent("dashboard", DashboardRenderer),
        provideGuipComponent("chart", ChartRenderer),
    ];
}