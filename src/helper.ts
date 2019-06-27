import { LineColPosition, LineColRange, SolcRange } from "./solc-ast";

export declare type LineBreaks = Array<number>;

/* Note: this assumes 1-origin lineColPosition's  */
export function offsetFromLineColPosition(position: LineColPosition, lineBreakPositions: LineBreaks): number {
  let lineOffset = 0;
  if (position.line > 1) {
    lineOffset = lineBreakPositions[position.line - 2] + 2;
  }
  return lineOffset + position.character - 1;
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
