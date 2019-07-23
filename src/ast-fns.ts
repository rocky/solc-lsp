/* solc AST functions generally in support of LSP-like things */

import { LineColRange, SolcAstNode, SolcAstWalker, SourceMappings } from "./solc-ast";
import { solcRangeFromLineColRange } from "./conversions";
import { SolcAstList, StaticInfo } from "./gather-info";

/* These are attributes of an AST node, which could
   include another AST node
*/
export interface SolcFileInfo {
  readonly content: string;  // Solidity source code as a string
  readonly ast: SolcAstNode;
  readonly sourceMapping: SourceMappings;
  readonly staticInfo: StaticInfo;
  readonly [x: string]: any;
}

// Store a list of declarations by index key.

/* Walk tree to be able to access a node by its id.
   Note that this is done in gatherInfo() so this is
   redundant and might be removed. */
/* FIXME: can we make this async? */
export function indexNodes(finfo: SolcFileInfo) {
  const id2node = {};
  const astWalker = new SolcAstWalker();
  const callback = function(node: SolcAstNode) {
    id2node[node.id] = node;
  }
  astWalker.walk(finfo.ast, callback);
  finfo.staticInfo.solcIds = id2node;
}

/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_typeDefinition

  for what we are trying to support.
*/
export function getTypeDefinition(finfo: SolcFileInfo, selection: LineColRange): SolcAstNode | null {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks)
  const node = sm.findNodeAtSourceSolcRange(null, solcLocation, finfo.ast);
  if (node === null) return null;
  return getDefinitionNodeFromSolcNode(finfo.staticInfo, node);
}

export function getTypeDefinitionNodeFromSolcNode(staticInfo: StaticInfo,
  node: SolcAstNode): SolcAstNode | null {
  if (node && ("typeDescriptions" in node && "referencedDeclaration" in node)) {
    const declNode = staticInfo.solcIds[node.referencedDeclaration];
    if ("typeName" in declNode) {
      return staticInfo.solcIds[declNode.typeName.id]
    }
    return declNode;
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
export function getDefinitionNodeFromSolcNode(staticInfo: StaticInfo,
  node: SolcAstNode): SolcAstNode | null {
  if (node && "referencedDeclaration" in node) {
    return staticInfo.solcIds[node.referencedDeclaration];
  }
  return null;
}

export function getDefinition(finfo: SolcFileInfo, selection: LineColRange): SolcAstNode | null {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks)
  const node = finfo.sourceMapping.findNodeAtSourceSolcRange(null, solcLocation, finfo.ast);
  if (node === null) return null;
  return getDefinitionNodeFromSolcNode(finfo.staticInfo, node);
}

/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_declaration
  for what we are trying to support.
*/
export function getReferencesFromSolcNode(staticInfo: StaticInfo,
  node: SolcAstNode): SolcAstList | null {
  let declNode: SolcAstNode | null = null
  if (node === null) return null;
  if ("referencedDeclaration" in node) {
    declNode = staticInfo.solcIds[node.referencedDeclaration];
  } else if (["VariableDeclaration"].includes(node.nodeType)) {
    declNode = node;
  }
  if (declNode === null) return null;
  return staticInfo.id2uses[declNode.id];
}

export function getReferences(finfo: SolcFileInfo, selection: LineColRange): SolcAstList | null {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks)
  const node = finfo.sourceMapping.findNodeAtSourceSolcRange(null, solcLocation, finfo.ast);
  if (node === null) return null;
  return getReferencesFromSolcNode(finfo.staticInfo, node);
}
