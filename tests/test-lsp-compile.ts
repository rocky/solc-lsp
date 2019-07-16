import tape from "tape";
import { getFileContent, LspManager } from "../out/lsp-manager";

tape("LSP Compile", (t: tape.Test) => {
  const lspConfig = {};
  const lm = new LspManager(lspConfig);
  t.test("compile", (st: tape.Test) => {
    const filePath = __dirname + "/resources/MetaCoin.sol";
    const content = getFileContent(filePath);
    const res = lm.compile(content, filePath);
    st.equal(res.sourceList.length, 2, "Picks up two sources to compile")
    st.equal(lm.textFromSrc("422:7:1"), "address", "textFromSrc() gets right text");
    st.equal(lm.textFromSrc("125:22:0"), "", "textFromSrc() when fileIndex not found");
    st.end();
  });

});
