import tape from "tape";
import { join } from "path"
import { SolcAstWalker, SolcAstNode, isSolcAstNode } from "../src/solc-ast/";
const fs = require("fs");

tape("SolcASTWalker", (t: tape.Test) => {
    const astWalker = new SolcAstWalker();
    t.test("ASTWalk", (st: tape.Test) => {
	let solidityAst = join(__dirname,  "/resources/ast.json");
	let ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));
	const astNodeCount = 91;
	// st.plan(1 + astNodeCount);
	let count: number = 0;
	let listenCount: number = 0;

	// Test event listening mechanism in walk below
	var walkListener = function(node) {
	    if (listenCount % 20 == 0) {
		st.ok(isSolcAstNode(node), "passed an ast node via a listener");
	    }
	    listenCount += 1;
	}
	astWalker.addListener('node', walkListener);

	astWalker.walk(ast, (node: SolcAstNode) => {
	    if (count % 20 == 0) {
		st.ok(isSolcAstNode(node), "passed an solc AST node");
	    }
	    count += 1;
	}, null);
	st.equal(count, astNodeCount, "traverses all AST nodes");
	st.equal(count, listenCount, "listen called back for AST nodes");

	count = 0;
	solidityAst = join(__dirname,  "/resources/MetaCoin.ast");

	// This is lame, but should work. */
	astWalker.walk(ast, null, null);

	t.throws(function() {
	    astWalker.walk(<SolcAstNode><unknown>null, null, null);
	});

	ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));
	// astWalker.walk(ast, (node) => {
	//     //     count += 1;
	//     // });
	//     // console.log(count);
	//     st.ok(node);

	//     let badCall = function() {
	// 	/* Typescript will keep us from calling walkFull with a legacyAST.
	// 	   However, for non-typescript uses, we add this test which casts
	// 	   to an AST to check that there is a run-time check in walkFull.
	// 	*/
	// 	astWalker.walk(<SolcAstNode>{}, (node: SolcAstNode) => {
	// 	    st.ok(node);
	// 	    count += 1;
	// 	});
	//     }
	//     t.throws(badCall, /first argument should be a solc AST/,
	// 	     "passing bad data fails");
	//     st.equal(count, 0, "traverses no AST nodes");
	// });
	st.end();
    });
});
