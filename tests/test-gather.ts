import tape from "tape";
import { join } from "path";
import { StaticInfo } from "../out/gather-info";
import { getFileContent } from "../out/solc-compile";
import { isSolcAstNode, sourceSolcRangeFromSrc } from "../out/solc-ast";

tape("gather-info", (t: tape.Test) => {
  const solidityAst = join(__dirname, "/resources/ast.json");
  const ast = JSON.parse(getFileContent(solidityAst));

  const staticInfo = new StaticInfo(ast, "0.5.10");

  t.test("offsetToAstNode", (st: tape.Test) => {

    type TupType = [number, // node id
        string, // src
        string, // nodeType
        string, // "type" or "type description"
        string, // type field
        number | undefined,    // parent.id
        number  // # of children
                   ];
    for (let tup of
   [<TupType>[62, "53:26:0", "VariableDeclaration", "type", "address", 26, 2],
    <TupType>[59, "53:7:0", "ElementaryTypeName", "type description", "address", 5, 0]
   ]) {
      const offset: number = tup[0];
      const src: string = tup[1];
      const nodeType = tup[2];
      const attrField = tup[3];
      const typeValue = tup[4];
      let node = staticInfo.offsetToAstNode(offset);
      if (node === null) {
        st.ok(false, "Node should not be null");
      } else {
        st.equal(node.nodeType, nodeType, `Node at offset ${offset}'s type`);
        st.equal(node.src, src, `Node at offset ${offset}'s src`);
        if (node.typeName && node.typeName.name) {
          st.equal(attrField, "type")
          st.equal(node.typeName.name, typeValue);
        } else if (node.typeDescriptions && node.typeDescriptions.typeString) {
          st.equal(attrField, "type description")
          st.equal(node.typeDescriptions.typeString, typeValue);
        } else {
          t.ok(false, `node at $offset} with ${node.src} has unexpected type ${node.nodeType}`);
        }
        if (node.parent)
          st.equal(node.parent.id, tup[5], "check parent id");
        else
          st.notOk(tup[5], `parent of node ${node.id} should be null`);
        if (node.children)
          st.equal(node.children.length, tup[6], "check # of children");
        else
          st.ok(false, `All nodes, e.g. ${node.id} should children`);
      }
    }

    const staticInfo2 = new StaticInfo({
      id: 0,
      nodeType: "Contract",
      src: "0:1:0",
    }, "0.5.10");
    let node = staticInfo2.offsetToAstNode(10);
    st.equal(node, null, `should fail to find ast node with wacky offset`);

    st.end();
  });

  t.test("solcRangeToASTNode", (st: tape.Test) => {
    const solidityPath = join(__dirname, "/resources/MetaCoin.json");
    const solidityJSON = JSON.parse(getFileContent(solidityPath));
    const staticInfo = new StaticInfo(solidityJSON.ast, "0.5.10");
    for (const tup of [["346:34:1", "VariableDeclaration"],  // exact
                       ["346:25:1", "Mapping"], //exact
                       ["346:24:1", "Mapping"],   // in range
                       ["346:26:1", "VariableDeclaration"],
                       ["347:26:1", "VariableDeclaration"],
                       ["347:24:1", "Mapping"]]) {
      const solcRange = sourceSolcRangeFromSrc(tup[0]);
      const astNode = staticInfo.solcRangeToAstNode(solcRange);
      if (astNode === null) {
        st.ok(false, `Should have found AST node for ${tup[0]}`);
      } else {
        st.strictEqual(isSolcAstNode(astNode), true, `should get AST for "${tup[0]}"`);
        st.strictEqual(astNode.nodeType, tup[1], `should get AST node of type ${tup[1]} for "${tup[0]}"`);
      }
    }
    st.end();
  });

  t.test("StaticInfoFields", (st: tape.Test) => {
    const solidityPath = join(__dirname, "/resources/lang-features-ast.json");
    const solidityJSON = JSON.parse(getFileContent(solidityPath));
    const staticInfo = new StaticInfo(solidityJSON, "0.5.10");

    const arrays = new Set(["data", "ids"]);
    st.deepEqual(staticInfo.arrays,  arrays);
    const bytes = new Set(["data"]);
    st.deepEqual(staticInfo.bytes, bytes);
    st.deepEqual(staticInfo.enums, { MyEnum: [ 'One', 'Two' ] });
    st.deepEqual(staticInfo.structs, { Snapshots: [ 'ids' ] });
    st.end();
  });

});
