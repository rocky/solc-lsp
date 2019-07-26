import tape from "tape";
import {
  getDefinitionNodeFromSolcNode,
  getFileContent, LspManager
} from "../out";

tape("LspManager", (t: tape.Test) => {
  t.test("AstFns", (st: tape.Test) => {
    const lspMgr = new LspManager();
    st.notOk(lspMgr.isCompiled("test.sol"));
    st.end();
  });

  t.test("Adding Solc Ids in imported code", (st: tape.Test) => {
    const lspMgr = new LspManager();
    const solFilePath = __dirname + "/resources/MetaCoin.sol";
    const solidityStr = getFileContent(solFilePath);
    lspMgr.compile(solidityStr, solFilePath).then(() => {
      const fileInfo = lspMgr.fileInfo;
      const targetNode = fileInfo[solFilePath].staticInfo.solcIds[74];
      const defNode = getDefinitionNodeFromSolcNode(fileInfo[solFilePath].staticInfo, targetNode);
      if (defNode === null) {
        st.ok(false, "should have found id from imported source")
      } else {
        st.isEqual(defNode.id, 111);
      }
      st.end();
    });

  });
});
