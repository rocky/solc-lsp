import tape from "tape-promise/tape";
import { compileSolc, getFileContent } from "../out/solc-compile";

tape("LSP Compile", (t: tape.Test) => {
  t.test("compile", (st: tape.Test) => {
    let filePath = __dirname + "/resources/MetaCoinR.sol";
    let content = getFileContent(filePath);
    compileSolc(content, filePath)
      .then((compiled) => {
        t.ok(compiled);
        // MetaCoin imports a function so we have 2 sources
        t.equal(Object.keys(compiled.sources).length, 2, "solc compiles and finds relative import");
      });

    filePath = __dirname + "/resources/oz-example/contracts/ERC20.sol";
    content = getFileContent(filePath);
    compileSolc(content, filePath)
      .then((compiled) => {
        t.ok(compiled);
        t.equal(Object.keys(compiled.sources).length, 4, "solc compiles and finds NPM imports");
      });

    /* Now try bad compilations */

    filePath = __dirname + "/resources/token-bad.sol";
    content = getFileContent(filePath);
    compileSolc(content, filePath)
      .then((compiled) => {
        // FIXME: I don't know why, but we get back a string rather than an object
        // I am guessing this is a tape-promise thing.
        t.ok(compiled);
        t.ok(compiled.errors.length > 1, "compileSolc catches solidity errors");
      });

    filePath = __dirname + "/resources/MetaCoinBad.sol";
    content = getFileContent(filePath);
    compileSolc(content, filePath)
      .then((compiled) => {
        // FIXME: I don't know why, but we get back a string rather than an object
        // I am guessing this is a tape-promise thing.
        t.ok(compiled);
        t.equal(compiled.errors.length, 1, "CompileSolc catches solidity import errors");
      });


    st.end();
  });
});
