import tape from "tape";
import { compileSolc, getFileContent } from "../out/solc-compile";

tape("LSP Compile", (t: tape.Test) => {
    t.test("compile", (st: tape.Test) => {
        const filePath = __dirname + "/resources/MetaCoin.sol";
        const content = getFileContent(filePath);
        st.ok(compileSolc(content, filePath, console.log, {}));
        st.end();
    });
});
