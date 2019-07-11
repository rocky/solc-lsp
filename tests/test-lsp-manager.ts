import tape from "tape";
import { LspManager } from "../out/lsp-manager";

tape("LspManager", (t: tape.Test) => {
  const lspConfig = {};
  const lspMgr = new LspManager(lspConfig);
  t.test("AstFns", (st: tape.Test) => {
    st.notOk(lspMgr.isCompiled("test.sol"));
    st.end();
  });

});
