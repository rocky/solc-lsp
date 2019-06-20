import { LineColPosition, LineColRange, Location } from "../node_modules/remix-astwalker/dist/types";

export declare type LineBreaks = Array<number>;

export function lspPositionToOffset(position: LineColPosition, lineBreakPositions: LineBreaks): number {
  let lineOffset = 0;
  if (position.line > 1) {
    lineOffset = lineBreakPositions[position.line - 2] + 2;
  }
  return lineOffset + position.character - 1;
}

export function rangeToLspPosition(range: LineColRange, lineBreakPositions: LineBreaks, file = 0): Location {
  const start = lspPositionToOffset(range.start, lineBreakPositions);
  const endOffset = lspPositionToOffset(range.end, lineBreakPositions);
  const length = endOffset - start;
  return <Location>{
    start,
    length,
    file,
  };
}
