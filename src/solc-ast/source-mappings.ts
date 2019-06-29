/* Things related to converting location information
*/
import { SolcAstWalker } from './walker';
import { isSolcAstNode, SolcAstNode, LineColPosition, LineColRange, SolcRange } from "./types";

export declare interface SourceMappings {
  new(): SourceMappings;
}

// This is intended to be compatibile with VScode's Position.
// However it is pretty common with other things too.
// Note: File index is missing here
type LineBreaks = Array<number>;

/*
  Binary Search:
  Assumes that @arg array is sorted increasingly
  return largest i such that array[i] <= target; return -1 if array[0] > target || array is empty

  Code copied from remix-lib/util.js
*/
function findLowerBound(target: number, array: Array<number>): number {
  var start = 0
  var length = array.length
  while (length > 0) {
    var half = length >> 1
    var middle = start + half
    if (array[middle] <= target) {
      length = length - 1 - half
      start = middle + 1
    } else {
      length = half
    }
  }
  return start - 1
}

/**
 * Turn an character offset into a "LineColPosition".
 *
 * @param offset  The character offset to convert.
 */
export function lineColPositionFromOffset(offset: number, lineBreaks: LineBreaks): LineColPosition {
  let line: number = findLowerBound(offset, lineBreaks);
  if (lineBreaks[line] !== offset) {
    line += 1;
  }
  const beginColumn = line === 0 ? 0 : (lineBreaks[line - 1] + 1);
  return <LineColPosition>{
    line: line + 1,
    character: (offset - beginColumn) + 1
  }
}

/**
 * Turn a solc AST's "src" attribute string (s:l:f)
 * into a SolcRange
 *
 * @param The object to convert.
 */
export function sourceSolcRangeFromSolcAstNode(astNode: SolcAstNode): SolcRange | null {
  if (isSolcAstNode(astNode) && astNode.src) {
    return sourceSolcRangeFromSrc(astNode.src)
  }
  return null;
}

/**
 * Break out fields of solc AST's "src" attribute string (s:l:f)
 * into its "start", "length", and "file index" components
 * and return that as a SolcRange
 *
 * @param src  A solc "src" field.
 */
export function sourceSolcRangeFromSrc(src: string): SolcRange {
  const split = src.split(':')
  return <SolcRange>{
    start: parseInt(split[0], 10),
    length: parseInt(split[1], 10),
    fileIndex: parseInt(split[2], 10)
  }
}

/**
 * Compact a source SolcRange to an solc AST's "src" string.
 *
 * @param src  A solc "src" field.
 */
export function srcFromSourceSolcRange(l: SolcRange): string {
  return `${l.start}:${l.length}:${l.fileIndex}`;
}

type ASTNodeCallbackFn = (node: SolcAstNode) => void;

/**
 * Retrieve the first "astNodeType" that includes the source map at arg instIndex, or "null" if none found.
 *
 * @param astNodeType   nodeType that a found ASTNode must be. Use "null" if any ASTNode can match.
 *                      FIXME: should this be a compare function?
 * @param sourceSolcRange "src" location that the AST node must match.
 * @param callback "callback" function that is called for each candidate AST node in the walk
 * @param astWalker "walker routine to use"
 */
export function nodeAtSourceSolcRange(astNodeType: string | undefined,
  sourceSolcRange: SolcRange, ast: SolcAstNode,
  callback?: ASTNodeCallbackFn,
  astWalker?: SolcAstWalker): SolcAstNode | null {
  if (!astWalker) {
    astWalker = new SolcAstWalker();
  }

  if (!callback) {
    callback = function(node: SolcAstNode) {
      let nodeSolcRange = sourceSolcRangeFromSolcAstNode(node);
      if (nodeSolcRange &&
        nodeSolcRange.start == sourceSolcRange.start &&
        nodeSolcRange.length == sourceSolcRange.length) {
        if (astNodeType == undefined || astNodeType === node.nodeType) {
          throw node;
        }
      }
    }
  }

  try {
    astWalker.walk(ast, callback);
  } catch (e) {
    if (isSolcAstNode(e)) {
      return e;
    } else {
      // Not ours. Reraise.
      throw e;
    }
  }
  return null;
}

/**
 * Routines for retrieving solc AST object(s) using some criteria, usually
 * includng "src' information.
 */
export class SourceMappings {

  readonly source: string;
  readonly lineBreaks: Array<number>;
  ast?: SolcAstNode;
  astWalker?: SolcAstWalker;

  constructor(source: string) {
    this.source = source;

    // Create a list of line offsets which will be used to map between
    // character offset and line/column positions.
    let lineBreaks: Array<number> = [];
    for (var pos = source.indexOf('\n'); pos >= 0; pos = source.indexOf('\n', pos + 1)) {
      lineBreaks.push(pos)
    }
    this.lineBreaks = lineBreaks;
  };

  /**
   * Get a list of nodes that are at the given "position".
   *
   * @param astNodeType  Type of node to return or null.
   * @param position     Character offset where AST node should be located.
   */
  nodesAtPosition(astNodeType: string | null, position: SolcRange, ast: SolcAstNode): Array<SolcAstNode> {
    const astWalker = new SolcAstWalker()
    let found: Array<SolcAstNode> = [];

    const callback = function(node: SolcAstNode): boolean {
      let nodeSolcRange = sourceSolcRangeFromSolcAstNode(node);
      if (nodeSolcRange &&
        nodeSolcRange.start == position.start &&
        nodeSolcRange.length == position.length) {
        if (!astNodeType || astNodeType === node.nodeType) {
          found.push(node)
        }
      }
      return true;
    }
    astWalker.walk(ast, callback);
    return found;
  }

  /**
   * Retrieve the first "astNodeType" that includes the source map at arg instIndex, or "null" if none found.
   * FIXME: should we allow a boolean compare function?
   *
   * @param astNodeType   nodeType that a found ASTNode must be. Use "null" if any ASTNode can match.
   * @param sourceSolcRange "src" location that the AST node must match.
   * @param ast "Ast we are searching" FIXME: pull out of cache
   */
  findNodeAtSourceSolcRange(astNodeType: string | undefined, sourceSolcRange: SolcRange, ast: SolcAstNode): SolcAstNode | null {
    /* FIXME: check cache for SolcRange here */
    const callback = function(node: SolcAstNode) {
      /* FIXME: cache stuff here. */
      let nodeSolcRange = sourceSolcRangeFromSolcAstNode(node);
      if (nodeSolcRange &&
        nodeSolcRange.start == sourceSolcRange.start &&
        nodeSolcRange.length == sourceSolcRange.length) {
        if (astNodeType == undefined || astNodeType === node.nodeType) {
          throw node;
        }
      }
    }
    return nodeAtSourceSolcRange(astNodeType, sourceSolcRange, ast, callback);
  }

  /**
   * Retrieve the line/column range position for the given source-mapping string.
   *
   * @param src  Solc "src" object containing attributes {source} and {length}.
   */
  lineColumnRangeFromSrc(src: string): LineColRange {
    const sourceSolcRange = sourceSolcRangeFromSrc(src);
    if (sourceSolcRange.start >= 0 && sourceSolcRange.length >= 0) {
      return <LineColRange>{
        start: lineColPositionFromOffset(sourceSolcRange.start, this.lineBreaks),
        end: lineColPositionFromOffset(sourceSolcRange.start + sourceSolcRange.length, this.lineBreaks)
      }
    } else {
      return <LineColRange>{
        start: null,
        end: null
      }
    }
  }

}
