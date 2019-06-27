import { EventEmitter } from "events";
import { isSolcAstNode, SolcAstNode } from "./types";

export declare interface SolcAstWalker {
  new(): EventEmitter;
}

/**
 * Crawl the given AST through the function walk(ast, callback)
 */
/**
 * visit all the AST nodes
 *
 * @param ast  - AST node

 * event('node', <Node Type | false>) will be fired for every node of type <Node Type>.
 * event('node', "*") will be fired for all other nodes.
 * in each case, if the event emits false it does not descend into children.
 * If no event for the current type, children are visited.
 */

export class SolcAstWalker extends EventEmitter {

  walkInternal(ast: SolcAstNode, callback: Function) {

    if (isSolcAstNode(ast)) {
      // console.log(`XXX id ${ast.id}, nodeType: ${ast.nodeType}, src: ${ast.src}`);
      this.emit("node", ast);
      callback(ast);
      for (let k of Object.keys(ast)) {
        // Possible optimization:
        // if (k in ['id', 'src', 'nodeType']) continue;
        const astItem = ast[k];
        if (Array.isArray(astItem)) {
          for (let child of astItem) {
            if (child) {
              this.walkInternal(child, callback);
            }
          }
        } else {
          this.walkInternal(astItem, callback);
        }
      }
    }
  }

  // Normalizes parameter callback and calls walkInternal
  walk(ast: SolcAstNode, callback: any) {
    if (!isSolcAstNode(ast)) throw new TypeError("first argument should be a solc ast");
    return this.walkInternal(ast, callback);
  }
}
