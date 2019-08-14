import tape from "tape";
import { join } from "path"
import {
  getDefinitionNodeFromSolcNode,
  getFileContent,
  LspManager
} from "../out";

tape("LspManager", (t: tape.Test) => {

  t.test("AstFns", (st: tape.Test) => {
    const lspMgr = new LspManager();
    st.notOk(lspMgr.isCompiled("test.sol"));
    st.end();
  });

  t.test("Adding Solc Ids in imported code", async (st: tape.Test) => {
    const lspMgr = new LspManager();
    const solFilePath = join(__dirname, "/resources/MetaCoin.sol");
    const solidityStr = getFileContent(solFilePath);

    await lspMgr.compile(solFilePath, solidityStr);

    const fileInfo = lspMgr.fileInfo;
    const targetNode = fileInfo[solFilePath].staticInfo.solcIds[74];
    const defNode = getDefinitionNodeFromSolcNode(fileInfo[solFilePath].staticInfo,
                                                  targetNode);

    st.ok(lspMgr.isCompiled(solFilePath),
          "isCompiled should be set after compiling file");

    if (defNode === undefined) {
      st.ok(false, "should have found id from imported source")
    } else {
      st.isEqual(defNode.id, 111, "found definition (getBalance) for node id 74");
    }

    let solcRange = {
      start: 0,
      length: 6,
      fileIndex: 0
    };
    let text = lspMgr.textFromSolcRange(solcRange);
    st.isEqual(text, "pragma", "should have extracted text from text");
    solcRange.fileIndex = 100;
    text = lspMgr.textFromSolcRange(solcRange);
    st.isEqual(text, "", "should not have found text from invalid solcRange");

    solcRange = {
      start: 737,
      length: 3,
      fileIndex: 1
    };

    let astNode = lspMgr.solcAstNodeFromSolcRange(solcRange)
    if (astNode === undefined)
      st.ok(false, "solcAstFromSolcNode should have returned an AST node");
    else {
      st.isEqual(astNode.id, 57, "solcAstFromSolcNode should find right AST node");
    }

    const sm = fileInfo[solFilePath].sourceMapping;
    const lcRange = sm.lineColRangeFromSolcRange(solcRange);

    const astNodePair = lspMgr.solcAstNodeFromLineColRange(solFilePath, lcRange);
    if (astNodePair === undefined)
      st.ok(false, "solcAstFromLineColRange should have returned an AST node");
    else {
      st.isEqual(astNodePair[0].ast.id, 96,
                 "solcAstFromlineColRange should find right AST node");
    }

    let range: any = {
      start: {
        line: 20,
        character: 6
      },
      end: {
        line: 20,
        character: 14
      }
    };
    range.active = range.anchor = range.end;

    astNode = lspMgr.gotoTypeDefinition(solFilePath, range);
    if (astNode === undefined)
      st.ok(false, "should have found type definition for MetaCoin 'balance'");
    else
      st.isEqual(astNode.id, 5, "found type definition for MetaCoin (balance)");

    astNode = lspMgr.gotoDefinition(solFilePath, range);
    if (astNode === undefined)
      st.ok(false, "should have found definition for Metacoin 'balance'");
    else {
      st.isEqual(astNode.id, 6, "found definition MetaCoin balance");
    }

    // And when we have an invalid path...
    astNode = lspMgr.gotoTypeDefinition("bogus", range);
    st.equal(astNode, undefined);
    astNode = lspMgr.gotoDefinition("bogus", range);
    st.equal(astNode, undefined);


    // if (typeInfo !== undefined) st.deepEqual(typeInfo.id, 2, `got right definition AST id`);

    // let info = lspMgr.gotoDefinition(solFilePath, range);
    // if (info !== undefinedy)
    //   st.equal(info.id, 5, "should get right AST node for 'owner'" );
    // else
    //   st.ok(info, "should have found definition for owner")
    st.end();
  });
});
