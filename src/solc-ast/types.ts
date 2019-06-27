/*
   Various type related to solc ASTs and the various ways to indicate a position or
   range in source text.
*/

/**
   Generic object test. This might be already defined somewhere else, but
   since I can't find one. I got this from:
   https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
*/
export function isObject(obj: any): boolean {
  return obj != null && obj.constructor.name === "Object"
}

/**
   Since we expect generic JavasSript clients, we need a runtime check, to see if
   a node is a solc AST Node. Typescript's type checking doesn't work for JavaScript
   code.
**/
export function isSolcAstNode(node: Object): boolean {
  return (
    isObject(node) &&
    'id' in node &&
    'nodeType' in node &&
    'src' in node
  )
}

export interface SolcRange {
  readonly start: number;
  readonly length: number;
  readonly fileIndex: number;
}

// This is intended to be compatibile with VScode's Position.
// However it is pretty common with other things too.
// Note: File index is missing here
export interface LineColPosition {
  readonly line: number;
  readonly character: number;
}

// This is intended to be compatibile with vscode's Range
// However it is pretty common with other things too.
// Note: File index is missing here.
export interface LineColRange {
  readonly start: LineColPosition | null;
  readonly end: LineColPosition | null;
}

export interface SolcAstNode {
  /* The following attributes are essential, and indicates an that object
     is an AST node. */
  readonly id: number;  // This is unique across all nodes in an AST tree
  readonly nodeType: string;
  readonly src: string;

  readonly absolutePath?: string;
  readonly exportedSymbols?: Object;
  readonly nodes?: Array<SolcAstNode>;
  readonly literals?: Array<string>;
  readonly file?: string;
  readonly scope?: number;
  readonly sourceUnit?: number;
  readonly symbolAliases?: Array<string>;
  readonly [x: string]: any;
}

/* These are attributes of an AST node, which could
   include another AST node
*/
export interface SolcAstNodeAtt {
  readonly operator?: string;
  readonly string?: null;
  readonly type?: string;
  readonly value?: string;
  readonly constant?: boolean;
  readonly name?: string;
  readonly public?: boolean;
  readonly exportedSymbols?: Object;
  readonly argumentTypes?: null;
  readonly absolutePath?: string;
  readonly [x: string]: any;
}
