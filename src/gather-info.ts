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

/* List of "id"s. These have some common property, like they are
 a list of definitions, or uses of a particular identifier (and scope)
*/
export type IdList = Array<number>;

export class StaticInfo {
  startOffset: StartList = {
    list: [],
    starts: [],
  };
  solcIds: SolcIdMap = {};
  // defs: SolcIdMap; /* For an Id which is a def, where are the use ids */

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
  }

  /* Collect AST information in a way to make LSP functions easy.
   */
  gatherInfo(ast: SolcAstNode) {
    const astWalker = new SolcAstWalker();
    astWalker.walk(ast, this.callbackFn);
    this.startOffset.starts = Object.keys(this.startOffset.list)
      .map(x => parseInt(x, 10)).sort(function(a, b) { return a - b });
  }

  /* Find an AST node that is closest to offset */
  offsetToAstNode(offset: number): SolcAstNode | null {
    const starts = this.startOffset.starts;
    let lb = findLowerBound(offset, starts);
    if (lb < 0) lb = 0;
    const startOffset = starts[lb];
    if (this.startOffset.list[startOffset]) {
      // FIXME: add min so that [0] is the smallest range.
      return this.solcIds[this.startOffset.list[startOffset][0].id]
    }
    return null;
  }
}
