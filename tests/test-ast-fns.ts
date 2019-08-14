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

  const staticInfo = new StaticInfo(ast, "0.5.10");

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
    let range: any = {
      start: {
        line: 9,
        character: 8
      },
      end: {
        line: 9,
        character: 13
      }
    };

    let typeInfo = getTypeDefinition(finfo, range);
    if (typeInfo !== undefined) st.deepEqual(typeInfo.id, 2, `got right definition AST id`);

    // Do another with no range/
    // st.equal(info, undefined, "definition not found");
    // console.log("-----");
    // const defInfo = lspMgr.gotoDefinition(solidityFile, range);
    // console.log(defInfo);
    // st.ok(defInfo);
    let info = getDefinition(finfo, range);
    if (info !== undefined)
      st.equal(info.id, 5, "should get right AST node for 'owner'" );
    else
      st.ok(info, "should have found definition for owner")

    // When the node isn't something that has a type...

    range.start.line = range.end.line = 4
    range.start.character = 9
    range.end.character = 17;

    info = getDefinition(finfo, range);
    if (info !== undefined)
      st.ok(false, "should not have have found definition for contract name")
    else
      st.equal(info, undefined, "no definition for contract is right")

    info = getTypeDefinition(finfo, range);
    if (info !== undefined)
      st.ok(false, "should not have have found type definition for contract name")
    else
      st.equal(info, undefined, "no type definition for contract name is right")

    // .. and when we can't find the dfinition...
    range.start.line = range.end.line = 1000;
    typeInfo = getTypeDefinition(finfo, range);
    st.equal(typeInfo, undefined,
             "should return undefined when for typeDefinition when no AST node found")

    info = getTypeDefinition(finfo, range);
    st.equal(typeInfo, undefined,
             "should return undefined when for definition when no AST node found")

    /* getReferences()... */

    /* contract Pausable is Ownership {
       bool is_paused;
            ^^^^^^^^^
    */
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
    st.equal(refInfo, undefined,
             "Should return undefined for references when no AST node found ")

    st.end();
  });

});
