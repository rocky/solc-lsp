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
