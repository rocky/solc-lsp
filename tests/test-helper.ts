import tape from "tape";
import { lspPositionToOffset, rangeToLspPosition } from "../out";
import { LineColPosition, Location } from "../out/types";

tape("helper", (t: tape.Test) => {
  const lineBreaks = [24, 25, 26, 47, 48, 80, 81, 111, 139,
    145, 146, 172, 210, 221, 227];
  t.test("lspPositionToOffset", (st: tape.Test) => {
    // FIXME: Tuples are the right thing to use here.
    let pos: LineColPosition | number;
    let expect: number | LineColPosition;
    for ([pos, expect] of [
      [<LineColPosition>{
        line: 9,
        character: 8
      }, 120],
      [{
        line: 1,
        character: 1
      }, 0],
      [{
        line: 0,
        character: 0
      }, -1]
    ]) {
      const got = lspPositionToOffset(<LineColPosition>pos, lineBreaks);
      st.equal(got, expect, `expect: ${expect}, got offset: ${got}`);
    }
    pos = <LineColPosition>{
      line: 1000,
      character: 1
    };
    st.ok(isNaN(lspPositionToOffset(pos, lineBreaks)), "too high offset gives NaN");
    st.end();
  });
  t.test("rangeToLspPosition", (st: tape.Test) => {
    const range = {
      start: {
        line: 9,
        character: 8
      },
      end: {
        line: 9,
        character: 13
      },
      active: {
        line: 8,
        character: 13
      },
      anchor: {
        line: 8,
        character: 8
      }
    };
    const srcPosition = rangeToLspPosition(range, lineBreaks)
    st.deepEqual(srcPosition,
      <Location>{ start: 120, length: 5, file: 0 });
    st.end();
  });

});
