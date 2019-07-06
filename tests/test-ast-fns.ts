import tape from "tape";
const fs = require("fs");
import { SourceMappings, SolcAstNode } from "../out/solc-ast";
import { SolcFileInfo } from "../out/ast-fns";
import { StaticInfo } from "../out/gather-info";
import { getDefinition, getTypeDefinition } from "../out";

tape("conversion", (t: tape.Test) => {
  const solidityAst = __dirname + '/resources/ast.json';
  const ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));
  const solidityFile = __dirname + '/resources/token-good.sol';
  const solidityStr = fs.readFileSync(solidityFile, 'utf8')

  const staticInfo = new StaticInfo(ast);

  const finfo = <SolcFileInfo>{
    ast,
    sourceMapping: new SourceMappings(solidityStr),
    staticInfo,
    content: '',
  };

  t.test("AstFns", (st: tape.Test) => {

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

    const typeInfo = getTypeDefinition(finfo, range);
    if (typeInfo !== null) st.deepEqual(typeInfo.id, 5, `got right definition AST id`);

    // Do another with no range/
    // st.equal(info, null, "definition not found");
    // console.log('-----');
    // const defInfo = lspMgr.gotoDefinition(solidityFile, range);
    // console.log(defInfo);
    // st.ok(defInfo);
    const info = getDefinition(finfo, range);
    if (info !== null) st.equal(info.id, 5);

    // st.equal(typeInfo, null, "type definition not found");
    st.end();
  });

});
