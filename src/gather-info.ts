/**
 * Collect information
 * includng "src' information.
 */

import { SolcAstNode } from "./solc-ast/types";
import { SolcAstWalker } from "./solc-ast/walker";
import { sourceSolcRangeFromSrc, findLowerBound } from "./solc-ast/source-mappings";

/* StartIdPair is an entry in a StartList which gives an AST id number
   and the length part of its src range. It
   has an implied start offset which is used to access the entry but is
   not part of this structure.
*/
export interface StartIdPair {
  length: number;
  id: number;
}

export interface StartListMap {
  [startOffset: number]: Array<StartIdPair>;
}

/*
   For caching offset to astNodes.
*/
export interface offsetAstNodeMap {
  [startOffset: number]: SolcAstNode;
}

/*
A StartList is used to find a range that closest encompases a position.
To use it, look in "starts" for the closet start offset before the postion.
Then using that adjusted offset, find both the node id and the
length of the solc as an item in "list". Several nodes may start at
a given offset, which is why "list" is a list. By convention generally you
want something which is the smallest range.
*/
export interface StartList {
  starts: Array<number>;
  list: StartListMap;
}

/* Maps a solc "id" field into its SolcASTNode */
export interface SolcIdMap {
  [id: number]: SolcAstNode;
}

/* List of "ASTs"s. These have some common property, like they are
 a list ofuses for a particular identifier (and scope)
*/
export type SolcAstList = Array<SolcAstNode>;

/* Maps a solc "id" field into  a list of SolcASTNodes */
export interface SolcIdMapList {
  [id: number]: SolcAstList;
}

export class StaticInfo {
  startOffset: StartList = {
    list: [],
    starts: [],
    // cache: offsetAstNodeMap
  };

  /* Retrive a solc AST node for a given
   *  id. Object.keys(x.solcIds).sort() is generally contains the nmbers
   *  from 0 to the number of nodes into of the AST */
  solcIds: SolcIdMap = {};

  /* Retrive a list solc AST nodes id for a given
   *  id. Object.keys(solcIds).sort() is generally the ids of
   *  declaration nodes, And Object.values(x.id2uses) are AST nodes of
   *  identifiers. If the ref is a local variable then its uses will
   *  all have the same scope value or a nested scope value. */

  id2uses: SolcIdMapList = {};  // Object.keys(Retrive a solc AST node id for a given id

  constructor(ast: SolcAstNode) {
    this.gatherInfo(ast);
  }

  callbackFn = (node: SolcAstNode) => {
    const solcRange = sourceSolcRangeFromSrc(node.src);
    const start = solcRange.start;
    if (!this.startOffset.list[start]) {
      this.startOffset.list[start] = [];
    }
    this.startOffset.list[start].push(
      <StartIdPair>{
        length: solcRange.length,
        id: node.id
      });
    this.solcIds[node.id] = node;
    if ("referencedDeclaration" in node) {
      const declId = node.referencedDeclaration;
      if (declId !== null) {
        if (declId in this.id2uses) {
          this.id2uses[declId].push(node);
        } else {
          this.id2uses[declId] = [node];
        }
      }
    }
  }

  /* Collect AST information in a way to make LSP functions easy.
     FIXME: can we make this async?
   */
  gatherInfo(ast: SolcAstNode) {
    const astWalker = new SolcAstWalker();
    astWalker.walk(ast, this.callbackFn);
    this.startOffset.starts = Object.keys(this.startOffset.list)
      .map(x => parseInt(x, 10)).sort(function(a, b) { return a - b });
  }

  /* Find an AST node that is closest to offset and if there are several
     at the offset, get the one with the smallest length.
     FIXME: generalize to other conditions other than say length.
   */
  offsetToAstNode(offset: number): SolcAstNode | null {
    const starts = this.startOffset.starts;
    let lb = findLowerBound(offset, starts);
    if (lb < 0) lb = 0;
    const startOffset = starts[lb];
    if (this.startOffset.list[startOffset]) {
      // Here we use smallest length, but we might parameterize or pass a condition to look for.
      const minTup = this.startOffset.list[startOffset].reduce((minTup, tup) => minTup.length < tup.length ? minTup : tup);
      const astNode = this.solcIds[minTup.id];
      // this.startOffset.cache[offset] = astNode;
      return astNode;
    }
    return null;
  }
}
