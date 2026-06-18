import { RuntimeNode } from "@ainative-ui/runtime-core";

export interface Renderer {
    render(node: RuntimeNode): unknown;
}

export class VueRenderer implements Renderer {
    render(node: RuntimeNode): unknown {
        return {
            framework: "vue",
            type: node.t,
            props: node.p,
            children: node.children?.map((child) => this.render(child))
        };
    }
}
