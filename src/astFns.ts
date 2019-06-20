// Store a list of declarations by index key.
// import { Location } from "../node_modules/remix-astwalker/dist/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const remixAST = require("remix-astwalker/dist");
import { rangeToLspPosition } from "./helper";
import { LineColRange } from "./types";

export function indexNodes(finfo: any) {
  const id2node = {};
  const astWalker = new remixAST.AstWalker();
  const callback = function(node: any) {
    id2node[node.id] = node;
  }
  astWalker.walkFull(finfo.ast, callback);
  finfo.id2node = id2node;
}

export function getTypeDefinition(finfo: any, selection: LineColRange): any {
  const sm = finfo.sourceMapping;
  const solcLocation = rangeToLspPosition(selection, sm.lineBreaks)
  const node = sm.findNodeAtSourceLocation(null, solcLocation, finfo.ast);
  if (node && ('typeDescriptions' in node)) {
    return node;
  }
  return null;
}

export function getDefinition(finfo: any, selection: LineColRange): any {
  const sm = finfo.sourceMapping;
  const solcLocation = rangeToLspPosition(selection, sm.lineBreaks)
  const node = finfo.sourceMapping.findNodeAtSourceLocation(null, solcLocation, finfo.ast);
  if (node && "referencedDeclaration" in node) {
    if (!('id2node' in finfo)) indexNodes(finfo);
    return finfo.id2node[node.referencedDeclaration];
  }
  return null;
}
