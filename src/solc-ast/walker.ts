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
 * The callback can be used to handle both pre-order and post-order,
 * traversion. In post-order, all children have been visited and the callback function
 * can make use of that. Preorder traversal can help in passing down attibutes from the
 * top like what the current function or contract is.
 */

export class SolcAstWalker extends EventEmitter {

    walkInternal(ast: SolcAstNode,
		 callbackPre: Function | null,
		 callbackPost: Function | null
		) {

    if (isSolcAstNode(ast)) {
	    // console.log(`XXX id ${ast.id}, nodeType: ${ast.nodeType}, src: ${ast.src}`);
      // Here parent and children are available.
      if (callbackPre !== null) callbackPre(ast);

      this.emit("node", ast);
      for (const child of this.getChildren(ast)) {
        this.walkInternal(child, callbackPre, callbackPost);
      }
      // Here parent and children are available.
      if (callbackPost !== null) callbackPost(ast);
    }
  }

  getChildren(astItem: SolcAstNode): Array<SolcAstNode> {
    let children: Array<SolcAstNode> = [];
    for (const field of Object.keys(astItem)) {
      if ([
        // All AST nodes have these
        "id", "src", "nodeType",

        // These are known not to be fields of an AST node
        "operator", "type", "constant", "name", "absolutePath",

        // These we ignore because we add them below:
        "children", "parent"

      ].includes(field))
        continue;

      const node: any = astItem[field];
      if (isSolcAstNode(node)) {
        children.push(node);
        node.parent = astItem;
      } else if (Array.isArray(node)) {
        for (let child of node) {
          if (isSolcAstNode(child)) {
            child.parent = astItem;
            children.push(child);
          }
        }
      }
    }
    astItem.children = children;
    return children;
  }


  // Normalizes parameter callback and calls walkInternal
  walk(ast: SolcAstNode, callbackPre: Function | null, callbackPost: Function| null) {
    if (!isSolcAstNode(ast)) throw new TypeError("First argument should be a solc AST");
    return this.walkInternal(ast, callbackPre, callbackPost);
  }
}
