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

 * This an also be used as an EventEmitter. Here, you would register the
 * callback listener node with a single node parameter like this:
 *
 *   const listener = function listener(node) {  ... }
 *
 * then create add this to an instance of this class:
 *
 *   const astWalker = new SolcAstWalker();
 *   astWalker.addListener("node", listener);
 *
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
    if (!isSolcAstNode(ast)) throw new TypeError("First argument should be a solc AST");
    return this.walkInternal(ast, callback);
  }
}
