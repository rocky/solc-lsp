import tape from "tape";
const fs = require("fs");
import { StaticInfo } from "../out/gather-info";

tape("gather-info", (t: tape.Test) => {
  const solidityAst = __dirname + '/resources/ast.json';
  const ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));

  const staticInfo = new StaticInfo(ast);

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
	  <TupType>[59, "53:7:0", "ElementaryTypeName", "type description", "address", undefined, 0]
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
    st.end();
  });
});
