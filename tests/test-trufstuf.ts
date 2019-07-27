import tape from "tape";
import { join } from "path"

import {
  isTruffleRoot, findTruffleRoot
} from "../out/trufstuf";

tape("trufstuf", (t: tape.Test) => {
  const ozExampleDir = join(__dirname, "resources/oz-example");
  t.test("isTruffleRoot", (st: tape.Test) => {

    st.ok(isTruffleRoot(ozExampleDir),
          `${ozExampleDir} should be a truffle root`);
    st.end();
  });

  t.test("findTruffleRoot", (st: tape.Test) => {
    const root = findTruffleRoot(ozExampleDir);
    for (const sol of
         [
	         'node_modules/openzeppelin-solidity/contracts/math/Math.sol',
	         'contracts/ERC20.sol'
         ]) {
      const p = join(ozExampleDir, sol);
      const found = findTruffleRoot(p);
      st.equal(root, found, `should find ${root} for ${sol}`)
    }
    for (const sol of
         [
	         'invalidirectory', // Directory doesn't exist
	         'ERC20.sol' // File doesn't exist
         ]) {
      const root = findTruffleRoot(sol);
      st.notOk(root, `should not find root for ${sol}`)
    }
    st.end();
  });
});
