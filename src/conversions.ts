/* Position conversion functions */

import { LineColPosition, LineColRange, SolcRange } from "./solc-ast";

export declare type LineBreaks = Array<number>;

/* Note: the default is 1-origin line and column lineColPosition's  */
export function offsetFromLineColPosition(position: LineColPosition, lineBreakPositions: LineBreaks,
  origin: number = 1): number {
  let lineOffset = 0;
  if (position.line > origin) {
    lineOffset = lineBreakPositions[position.line - (1 + origin)] + (1 + origin);
  }
  return lineOffset + position.character - origin;
}

export function solcRangeFromLineColRange(range: LineColRange, lineBreakPositions: LineBreaks, fileIndex = 0): SolcRange {
  const start = offsetFromLineColPosition(<LineColPosition>range.start, lineBreakPositions);
  const endOffset = offsetFromLineColPosition(<LineColPosition>range.end, lineBreakPositions);
  const length = endOffset - start;
  return <SolcRange>{
    start,
    length,
    fileIndex,
  };
}
