import tape from "tape";
const fs = require("fs");
import { SourceMappings } from "../out/solc-ast";
import { getDefinition, getTypeDefinition } from "../out";

tape("conversion", (t: tape.Test) => {
  const solidityAst = __dirname + '/resources/ast.json';
  const ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));
  const solidityFile = __dirname + '/resources/token-good.sol';
  const solidityStr = fs.readFileSync(solidityFile, 'utf8')

  const finfo = {
    ast: ast,
    sourceMapping: new SourceMappings(solidityStr)
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
    st.deepEqual(typeInfo,
      {
        argumentTypes: null,
        id: 8,
        name: 'owner',
        nodeType: 'Identifier',
        overloadedDeclarations: [],
        referencedDeclaration: 5, src: '120:5:0',
        typeDescriptions: { typeIdentifier: 't_address', typeString: 'address' }
      }, `definition: got ${typeInfo}`);

    // Do another with no range/
    // st.equal(info, null, "definition not found");
    // console.log('-----');
    // const defInfo = lspMgr.gotoDefinition(solidityFile, range);
    // console.log(defInfo);
    // st.ok(defInfo);
    const info = getDefinition(finfo, range);
    st.equal(info.id, 5);

    // st.equal(typeInfo, null, "type definition not found");
    st.end();
  });

});
