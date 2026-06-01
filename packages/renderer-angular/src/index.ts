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
    ChartRenderer,
    TabsRenderer,
    DialogRenderer,
    DrawerRenderer,
    GridRenderer,
    FlexRenderer,
    StackRenderer,
    KpiRenderer,
    DashboardRenderer,
    WorkflowRenderer,
    TimelineRenderer,
    ExecutionGraphRenderer
} from "./components/core-components";

export * from "./provider";
export * from "./dynamic-renderer.component";
export * from "./components/core-components";

// Provide all default mappings in one clean provider function
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
        provideGuipComponent("chart", ChartRenderer),
        provideGuipComponent("tabs", TabsRenderer),
        provideGuipComponent("dialog", DialogRenderer),
        provideGuipComponent("drawer", DrawerRenderer),
        provideGuipComponent("grid", GridRenderer),
        provideGuipComponent("flex", FlexRenderer),
        provideGuipComponent("stack", StackRenderer),
        provideGuipComponent("kpi", KpiRenderer),
        provideGuipComponent("dashboard", DashboardRenderer),
        provideGuipComponent("workflow", WorkflowRenderer),
        provideGuipComponent("timeline", TimelineRenderer),
        provideGuipComponent("executionGraph", ExecutionGraphRenderer)
    ];
}
