/* Copyright 2919 Rocky Bernstein

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
  };
  astWalker.walk(finfo.ast, callback, undefined);
  finfo.staticInfo.solcIds = id2node;
}

/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_typeDefinition

  for what we are trying to support.
*/
export function getTypeDefinition(finfo: SolcFileInfo, selection: LineColRange): SolcAstNode | undefined {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks);
  const node = sm.findNodeAtSourceSolcRange(undefined, solcLocation, finfo.ast);
  if (node === undefined) return undefined;
  return getTypeDefinitionNodeFromSolcNode(finfo.staticInfo, node);
}

export function getTypeDefinitionNodeFromSolcNode(staticInfo: StaticInfo,
  node: SolcAstNode): SolcAstNode | undefined {
  if (node && ("typeDescriptions" in node && "referencedDeclaration" in node)) {
    const declNode = staticInfo.solcIds[node.referencedDeclaration];
    if ("typeName" in declNode) {
      return staticInfo.solcIds[declNode.typeName.id];
    }
    return declNode;
  }
  return undefined;
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
  node: SolcAstNode): SolcAstNode | undefined {
  if (node && "referencedDeclaration" in node) {
    return staticInfo.solcIds[node.referencedDeclaration];
  }
  return undefined;
}

export function getDefinition(finfo: SolcFileInfo, selection: LineColRange): SolcAstNode | undefined {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks);
  const node = finfo.sourceMapping.findNodeAtSourceSolcRange(undefined, solcLocation, finfo.ast);
  if (node === undefined) return undefined;
  return getDefinitionNodeFromSolcNode(finfo.staticInfo, node);
}

/*
  See:
  https://microsoft.github.io/language-server-protocol/specification#textDocument_declaration
  for what we are trying to support.
*/
export function getReferencesFromSolcNode(staticInfo: StaticInfo,
  node: SolcAstNode): SolcAstList | undefined {
  let declNode: SolcAstNode | undefined = undefined;
  if (node === undefined) return undefined;
  if ("referencedDeclaration" in node) {
    declNode = staticInfo.solcIds[node.referencedDeclaration];
  } else if (["VariableDeclaration"].includes(node.nodeType)) {
    declNode = node;
  }
  if (declNode === undefined) return undefined;
  return staticInfo.id2uses[declNode.id];
}

export function getReferences(finfo: SolcFileInfo, selection: LineColRange): SolcAstList | undefined {
  const sm = finfo.sourceMapping;
  const solcLocation = solcRangeFromLineColRange(selection, sm.lineBreaks);
  const node = finfo.sourceMapping.findNodeAtSourceSolcRange(undefined, solcLocation, finfo.ast);
  if (node === undefined) return undefined;
  return getReferencesFromSolcNode(finfo.staticInfo, node);
}
