import tape from "tape";
const fs = require("fs");
import { StaticInfo } from "../out/gather-info";

tape("gather-info", (t: tape.Test) => {
  const solidityAst = __dirname + '/resources/ast.json';
  const ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));

  const staticInfo = new StaticInfo(ast);

  t.test("offsetToAstNode", (st: tape.Test) => {

    type TupType = [number, string, string, string, string];
    for (let tup of [<TupType>[62, "53:26:0", "VariableDeclaration", "type", "address"],
    <TupType>[59, "53:7:0", "ElementaryTypeName", "type description", "address"]]) {
      const offset: number = tup[0];
      const src: string = tup[1];
      const nodeType = tup[2];
      const attrField = tup[3];
      const typeValue = tup[4];
      let node = staticInfo.offsetToAstNode(offset);
      if (node === null) {
        st.ok(false, "Node should not be null");
      } else {
        st.equal(node.nodeType, nodeType, `Node at ${offset}'s type`);
        st.equal(node.src, src, `Node at ${offset}'s src`);
        if (node.typeName && node.typeName.name) {
          st.equal(attrField, "type")
          st.equal(node.typeName.name, typeValue);
        } else if (node.typeDescriptions && node.typeDescriptions.typeString) {
          st.equal(attrField, "type description")
          st.equal(node.typeDescriptions.typeString, typeValue);
        } else {
          t.ok(false, `node at $offset} with ${node.src} has unexpected type ${node.nodeType}`);
        }
      }
    }
    st.end();
  });
});
