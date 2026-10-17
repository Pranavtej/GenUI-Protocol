import { renderToStaticMarkup } from "react-dom/server";
import type { ASTDocument } from "@genui-protocol/ast";
import { GenUiRenderer, createSession } from "@genui-protocol/renderer-react";

/** Size in characters of the HTML a document renders to: a rough proxy for what a model would emit as markup. */
export const htmlSize = (doc: ASTDocument): number =>
    renderToStaticMarkup(<GenUiRenderer session={createSession({ document: doc })} />).length;
