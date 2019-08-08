import tape from "tape";
import { join } from "path"
const fs = require("fs");
import { SourceMappings } from "../out/solc-ast";
import { SolcFileInfo } from "../out/ast-fns";
import { StaticInfo } from "../out/gather-info";
import { getDefinition, getTypeDefinition, getReferences } from "../out";

tape("conversion", (t: tape.Test) => {
  const solidityAst = join(__dirname, "/resources/ast.json");
  const ast = JSON.parse(fs.readFileSync(solidityAst, "utf8"));
  const solidityFile = join(__dirname, "/resources/token-good.sol");
  const solidityStr = fs.readFileSync(solidityFile, "utf8")

  const staticInfo = new StaticInfo(ast);

  const finfo = <SolcFileInfo>{
    ast,
    sourceMapping: new SourceMappings(solidityStr),
    staticInfo,
    content: solidityStr,
  };

  t.test("AstFns", (st: tape.Test) => {

    /* owner = msg.sender
       ^^^^^
       of token-good.sol is line 9 characters 8-13
    */
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

    let typeInfo = getTypeDefinition(finfo, range);
    if (typeInfo !== null) st.deepEqual(typeInfo.id, 5, `got right definition AST id`);

    // Do another with no range/
    // st.equal(info, null, "definition not found");
    // console.log("-----");
    // const defInfo = lspMgr.gotoDefinition(solidityFile, range);
    // console.log(defInfo);
    // st.ok(defInfo);
    let info = getDefinition(finfo, range);
    if (info !== null) st.equal(info.id, 5);

    /* And when we can't find the dfinition... */
    range.start.line = range.end.line = 1;
    typeInfo = getTypeDefinition(finfo, range);
    st.equal(typeInfo, null,
             "Should return null when for typeDefinition when no AST node found")

    info = getTypeDefinition(finfo, range);
    st.equal(typeInfo, null,
             "Should return null when for dfinition when no AST node found")

    /* getReferences()... */
    const refRange = {
      start: {
        line: 21,
        character: 4
      },
      end: {
        line: 21,
        character: 18
      },
      active: {
        line: 21,
        character: 4
      },
      anchor: {
        line: 21,
        character: 18
      }
    };

    let refInfo = getReferences(finfo, refRange);
    if (refInfo) {
      const got = refInfo.map(r => [r.id, r.nodeType]);
      st.deepEqual(got,
                   [ [ 33, 'Identifier' ],
                     [ 44, 'Identifier' ],
                     [ 54, 'Identifier' ] ],
                   "getReferences of token-good.sol 'is_paused'")
    } else {
      st.ok(refInfo, "Should have found 3 references")
    }

    // And when we can't find the node... */
    refInfo = getReferences(finfo, range);
    st.equal(refInfo, null,
             "Should return null for references when no AST node found ")

    st.end();
  });

});
