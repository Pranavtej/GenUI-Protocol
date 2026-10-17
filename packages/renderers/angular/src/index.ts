import { provideGenUiComponent } from "./provider";
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
    GENUI_CORE_RENDERERS
} from "./components/core-components";
import { StackRenderer, TabsRenderer, DialogRenderer, DrawerRenderer, WorkflowRenderer, TimelineRenderer, ExecutionGraphRenderer } from "./components/extra-components";

export * from "./provider";
export * from "./dynamic-renderer.component";
export * from "./renderer.component";
export * from "./components/core-components";
export * from "./components/extra-components";
export * from "./session";
export * from "./session-host.component";
export { provideGenUiTheme, GENUI_DEFAULT_THEME_CSS, GENUI_THEME_TOKEN } from "./theme-provider";

export * from "./ui";

export function provideGenUiRenderer() {
    return [
        provideGenUiComponent("page", PageRenderer),
        provideGenUiComponent("section", SectionRenderer),
        provideGenUiComponent("card", CardRenderer),
        provideGenUiComponent("text", TextRenderer),
        provideGenUiComponent("heading", HeadingRenderer),
        provideGenUiComponent("button", ButtonRenderer),
        provideGenUiComponent("input", InputRenderer),
        provideGenUiComponent("textarea", TextareaRenderer),
        provideGenUiComponent("select", SelectRenderer),
        provideGenUiComponent("checkbox", CheckboxRenderer),
        provideGenUiComponent("table", TableRenderer),
        provideGenUiComponent("grid", GridRenderer),
        provideGenUiComponent("flex", FlexRenderer),
        provideGenUiComponent("kpi", KpiRenderer),
        provideGenUiComponent("dashboard", DashboardRenderer),
        provideGenUiComponent("chart", ChartRenderer),
        provideGenUiComponent("stack", StackRenderer),
        provideGenUiComponent("tabs", TabsRenderer),
        provideGenUiComponent("dialog", DialogRenderer),
        provideGenUiComponent("drawer", DrawerRenderer),
        provideGenUiComponent("workflow", WorkflowRenderer),
        provideGenUiComponent("timeline", TimelineRenderer),
        provideGenUiComponent("executionGraph", ExecutionGraphRenderer),
    ];
}