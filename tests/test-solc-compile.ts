import tape from "tape-promise/tape";
import { compileSolc, getFileContent } from "../out/solc-compile";

tape("LSP Compile", (t: tape.Test) => {
    t.test("compile", (st: tape.Test) => {
        let filePath = __dirname + "/resources/MetaCoin.sol";
        let content = getFileContent(filePath);
        compileSolc(content, filePath, console.log).then((compiledStr) => {
	    // FIXME: I don't know why, but we get back a string rather than an object
	    // I am guessing this is a tape-promise thing.
	    t.ok(compiledStr);
	    const compiled = JSON.parse(compiledStr);
	    // MetaCoin imports a function so we have 2 sources
	    t.equal(Object.keys(compiled.sources).length, 2, "solc compiles and finds relative import");
	});
        filePath = __dirname + "/resources/token-bad.sol";
        content = getFileContent(filePath);
        compileSolc(content, filePath, console.log).then((compiledStr) => {
	    // FIXME: I don't know why, but we get back a string rather than an object
	    // I am guessing this is a tape-promise thing.
	    t.ok(compiledStr);
	    const compiled = JSON.parse(compiledStr);
	    t.ok(compiled.errors.length > 1, "Solc catches solidity errors");
	});
	st.end();
    });
});
