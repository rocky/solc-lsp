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

/**
 * Collect information
 * includng "src' information.
 */

import { readdirSync } from "fs";
import { join } from "path";
import { SolcRange, SolcAstNode } from "./solc-ast/types";
import { SolcAstWalker } from "./solc-ast/walker";
import { sourceSolcRangeFromSrc, findLowerBound } from "./solc-ast/source-mappings";

export interface NodeTypeCallbackFn {
  fn: (staticInfo: StaticInfo, node: SolcAstNode) => void
};

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

/* Maps a solc "id" field into its SolcAstNode */
interface SolcIdMap {
  [id: number]: SolcAstNode;
}

/* List of "ASTs"s. These have some common property, like they are
 a list ofuses for a particular identifier (and scope)
*/
export type SolcAstList = Array<SolcAstNode>;

/* Maps a solc "id" field into  a list of SolcAstNodes */
export interface SolcIdMapList {
  [id: number]: SolcAstList;
}

/* Maps a solc name to a list of strings a list. Used for enum name to
   its literals, or struct to its members, for example. */
export interface SolcNameToStrList {
  [name: string]: Array<string>;
}

/* Maps a solc name to a list of string. Used for nodeTypes
   where the only information we want is its name, for example. */
export interface SolcNameToStr {
  [name: string]: string;
}

/* Maps a solc name to a list of string. Used for nodeTypes
   where the only information we want is its name, for example. */
export interface NodeTypeToSet {
  [name: string]: Set<string>;
}

interface NodeTypeCallbackFns {
  [fn: string]: NodeTypeCallbackFn;
};

/* Temporary used in walking the AST. */
interface TempInfo {
  contractName: string,
  functionName: string
};

/* Function Signature */
export interface Signature {
  params: Array<{paramName: string, paramType: string}>;
  returns: Array<{paramName: string, paramType: string}>;
};

/* What's the funtion signature for a contract function? */
export interface ContractFnToSignature {
  [contractFnName: string]: Signature;
};

export interface ContractFnVarToType {
  [contractFnVarName: string]: string;
};

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

  id2uses: SolcIdMapList = {};  // Retrieve a solc AST node id for a given id

  /* Note: these don't take into account scope yet */
  arrays: any = new Set([]);   // Set of names of array variables
  bytes: any = new Set([]);   // Set of names of variables of the `bytes` type.

  enums:  SolcNameToStrList = {};   // Map of enum name to its literals.
  structs: SolcNameToStrList = {}; // Map of struct definitions

  events: ContractFnToSignature = {}; // Map of events keyed by contract.name to its signature
  fns: ContractFnToSignature = {};  // Map of functions, keyed by contract.name to its signature

  vars: ContractFnVarToType = {};

  nodeTypeCallbackFnPre: NodeTypeCallbackFns = {};
  nodeTypeCallbackFnPost: NodeTypeCallbackFns = {};
  nodeType: NodeTypeToSet = {};
  tempInfo: TempInfo = {
    contractName: "",
    functionName: "" // Note: events are treated like functions here.
  };

  constructor(ast: SolcAstNode) {
    this.readNodeTypeCallbacks();
    this.gatherInfo(ast);
  }

  readNodeTypeCallbacks(): void {
    // TODO: put in a loop over pre/post?
    let callbackDir = join(__dirname, "./nodetype-callback-pre");
    let paths = readdirSync(callbackDir);
    for (const pathName of paths) {
      const extIndex = pathName.length - 3;
      if (pathName.substring(extIndex) === ".js") {
        // console.log(file); // XXX
        const mod = require(join(callbackDir, pathName));
        const name = pathName.substr(0, extIndex);
        this.nodeTypeCallbackFnPre[name] = mod.register();
      }
    }
    callbackDir = join(__dirname, "./nodetype-callback-post");
    paths = readdirSync(callbackDir);
    for (const pathName of paths) {
      const extIndex = pathName.length - 3;
      if (pathName.substring(extIndex) === ".js") {
        // console.log(file); // XXX
        const mod = require(join(callbackDir, pathName));
        const name = pathName.substr(0, extIndex);
        this.nodeTypeCallbackFnPost[name] = mod.register();
      }
    }
  }

  /* Note: some of the below could be done either
     pre or post */
  callbackFnPre = (node: SolcAstNode) => {
    const nodeType = node.nodeType;
    if (nodeType in this.nodeTypeCallbackFnPre) {
      this.nodeTypeCallbackFnPre[nodeType].fn(this, node);
      if (node.name) {
        if (!this.nodeType[nodeType]) {
          this.nodeType[nodeType] = new Set([node.name]);
        } else {
          this.nodeType[nodeType].add(node.name);
        }
      }
      node.contractName = this.tempInfo.contractName;
      node.functionName = this.tempInfo.functionName;
    }
  }

  callbackFnPost = (node: SolcAstNode) => {
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
    const nodeType = node.nodeType;
    if (nodeType in this.nodeTypeCallbackFnPost) {
      this.nodeTypeCallbackFnPost[nodeType].fn(this, node);
    }
    if (node.name == "bytes") {
        const parent = node.parent;
        if (parent && parent.nodeType == "VariableDeclaration") {
        const parentName: string = parent.name;
        this.bytes.add(parentName);
        }
    }
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
    astWalker.walk(ast, this.callbackFnPre, this.callbackFnPost);
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
      /* We want smallest length for this start address, that covers
         the range.  But this can be subtle. Consider:

           address owner = msg.sender;
           ^^^^^^^ type name
           ^^^^^^^^^^^^^^^^^^^^^^^^^^ Variable Declaration
                          ^ we want info about here

         Taking the shortest string that starts at the beginning of
         the line (here, a type name) is wrong. We also need to check
         that it also spans where we are inside the variable
         declaration.
      */
      // TODO: parameterize or pass a condition to look for?
      let minTup: StartIdPair | null = null;
      for (const tup of this.startOffset.list[startOffset]) {
        if (startOffset + tup.length > offset) {
          if (minTup == null || minTup.length > tup.length)
            minTup = tup;
        }
      }
      if (minTup == null) return null;
      const astNode = this.solcIds[minTup.id];
      // this.startOffset.cache[offset] = astNode;
      return astNode;
    }
    /* Unreachable since findLowerBound always finds something.
       The below is however to make typescript happy. */
    /* istanbul ignore next */
    return null;
  }

  /* Find an AST node that is closest to offset and if there are several
     at the offset, get the one with the smallest length.
     FIXME: generalize to other conditions other than say length.
   */
  solcRangeToAstNode(range: SolcRange): SolcAstNode | null {
    const starts = this.startOffset.starts;
    const endOffset = range.start + range.length;
    let lb = findLowerBound(range.start, starts);
    if (lb < 0) lb = 0;
    const startOffset = starts[lb];
    if (this.startOffset.list[startOffset]) {
      /* We want smallest length for this start address, that covers
         the range.  But this can be subtle. Consider:

         address owner = msg.sender;
         ^^^^^^^ type name
         ^^^^^^^^^^^^^^^^^^^^^^^^^^ Variable Declaration
                         ^ we want info about here

         Taking the shortest string that starts at the beginning of
         the line (here, a type name) is wrong. We also need to check
         that it also spans where we are inside the variable
         declaration.
      */
      // TODO: parameterize or pass a condition to look for?

      let minTup: StartIdPair | null = null;

      for (const tup of this.startOffset.list[startOffset]) {
        if (startOffset + tup.length >= endOffset) {
          if (minTup == null || minTup.length > tup.length)
            minTup = tup;
        }
      }
      if (minTup == null) return null;
      const astNode = this.solcIds[minTup.id];
      // this.startOffset.cache[offset] = astNode;
      return astNode;
    }
    /* Unreachable since findLowerBound always finds something.
       The below is however to make typescript happy. */
    /* istanbul ignore next */
    return null;
  }

}
