/* solc AST functions generally in support of LSP-like things */

import { LineColRange, SolcAstWalker } from "./solc-ast";
import { solcRangeFromLineColRange } from "./conversions";

// Store a list of declarations by index key.
// import { Location } from "../node_modules/remix-astwalker/dist/types";

/* FIXME: can we make this async? */
export function indexNodes(finfo: any) {
  const id2node = {};
  const astWalker = new SolcAstWalker();
  const callback = function(node: any) {
    id2node[node.id] = node;
  }
  astWalker.walk(finfo.ast, callback);
  finfo.id2node = id2node;
}

/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_typeDefinition

  for what we are trying to support.
*/
export function getTypeDefinition(finfo: any, selection: LineColRange): any {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks)
  const node = sm.findNodeAtSourceSolcRange(null, solcLocation, finfo.ast);
  if (node && ("typeDescriptions" in node)) {
    return node;
  }
  return null;
}

/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_signatureHelp
  for what we are trying to support.
*/
/* For now, we will say a signature is just the same as getting the
   type definition. To distingush between the two, use the returned
   node's "referencedDeclaration" attribute and check that its
   nodeType is "EventDefintion" or "FunctionDefinition".
*/
export const getSignature = getTypeDefinition;


/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_declaration
  for what we are trying to support.
*/
export function getDefinition(finfo: any, selection: LineColRange): any {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks)
  const node = finfo.sourceMapping.findNodeAtSourceSolcRange(null, solcLocation, finfo.ast);
  if (node && "referencedDeclaration" in node) {
    if (!('id2node' in finfo)) indexNodes(finfo);
    return finfo.id2node[node.referencedDeclaration];
  }
  return null;
}
