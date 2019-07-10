import tape from "tape";
const fs = require("fs");

import {
    SolcAstNode, isSolcAstNode,
    LineColPosition, lineColPositionFromOffset,
    SourceMappings,
    sourceSolcRangeFromSolcAstNode,
} from "../src/solc-ast";

tape("SourceMappings", (t: tape.Test) => {
    const solidityPath = __dirname + '/resources/contract.sol';
    const source = fs.readFileSync(solidityPath, 'utf8');
    const solidityAst = __dirname + '/resources/ast.json';
    const ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));
    const srcMappings = new SourceMappings(source);

    t.test("SourceMappings conversions", (st: tape.Test) => {
	// st.plan(10);

	st.deepEqual(lineColPositionFromOffset(0, srcMappings.lineBreaks, 1, 1),
		     <LineColPosition>{ line: 1, character: 1 },
		     "lineColPositionFromOffset degenerate case");
	st.deepEqual(lineColPositionFromOffset(200, srcMappings.lineBreaks, 1, 1),
		     <LineColPosition>{ line: 17, character: 1 },
		     "lineColPositionFromOffset conversion");

	/* Typescript will keep us from calling sourceSolcRangeFromAstNode
	   with the wrong type. However, for non-typescript uses, we add
	   this test which casts to an AST to check that there is a
	   run-time check in walkFull.
	*/
	st.notOk(sourceSolcRangeFromSolcAstNode(<SolcAstNode> {}),
		 "sourceSolcRangeFromSolcAstNode rejects an invalid astNode");

	st.deepEqual(sourceSolcRangeFromSolcAstNode(ast.nodes[0]),
		     { start: 0, length: 24, fileIndex: 0 },
		     "sourceSolcRangeFromSolcAstNode extracts a location");


	// const srcStr = "32:6:0";
	// st.deepEqual(srcMappings.sourceSolcRangeFromSrc(srcStr), loc,
	// 	     "sourceSolcRangeFromSrc conversion");

	// st.equal(srcMappings.srcFromSourceSolcRange(sourceSolcRangeFromSrc(srcStr)), srcStr,
	// 	 "srcSolcRangeFromSource <-> sourceSolcRangeFromSrc roundtrip");

	// const startLC = <LineColPosition>{ line: 6, character: 6 };
	// st.deepEqual(srcMappings.srcToLineColumnRange("45:96:0"),
	// 	     <LineColRange>{
	// 		 start: startLC,
	// 		 end: <LineColPosition>{ line: 11, character: 6 }
	// 	     }, "srcToLineColumnRange end of line");
	// st.deepEqual(srcMappings.srcToLineColumnRange("45:97:0"),
	// 	     <LineColRange>{
	// 		 start: startLC,
	// 		 end: <LineColPosition>{ line: 12, character: 1 }
	// 	     }, "srcToLineColumnRange beginning of next line");
	// st.deepEqual(srcMappings.srcToLineColumnRange("45:98:0"),
	// 	     <LineColRange>{
	// 		 start: startLC,
	// 		 end: <LineColPosition>{ line: 13, character: 1 }
	// 	     }, "srcToLineColumnRange skip over empty line");
	// st.deepEqual(srcMappings.srcToLineColumnRange("-1:0:0"),
	// 	     <LineColRange>{
	// 		 start: null,
	// 		 end: null
	// 	     }, "srcToLineColumnRange invalid range");
	st.end();
    });


    t.test("SourceMappings constructor", (st: tape.Test) => {
	st.plan(2);
	st.equal(srcMappings.source, source, "sourceMappings object has source-code string");
	st.deepEqual(srcMappings.lineBreaks,
		     [ 15, 26, 27, 38, 39, 81, 87, 103, 119, 135, 141, 142, 186, 192, 193, 199,
		       201 ],
		     "sourceMappings has line-break offsets");
	st.end();
    });
    t.test("SourceMappings functions", (st: tape.Test) => {
	// st.plan(5);

	const loc = { start: 413, length: 16, fileIndex: 0 };
	const astNode: any = srcMappings.findNodeAtSourceSolcRange('ExpressionStatement', loc, ast);
	st.ok(!!astNode, "findNodeAtSourceSolcRange should find something");
	st.ok(isSolcAstNode(astNode), "findsNodeAtSourceSolcRange finds something");
	const astNode2 = srcMappings.findNodeAtSourceSolcRange('NotARealThingToFind', loc, ast);
	st.ok(!astNode2, "findNodeAtSourceSolcRange should not find ASTnode");
	/**
	st.notOk(isSolcAstNode(astNode),
		 "findsNodeAtSourceSolcRange fails to find something when it should");
	let astNodes = srcMappings.nodesAtPosition(null, loc, ast);
	st.equal(astNodes.length, 2, "nodesAtPosition should find more than one astNode");
	st.ok(isSolcAstNode(astNodes[0]), "nodesAtPosition returns only AST nodes");
	astNodes = srcMappings.nodesAtPosition("ExpressionStatement", loc, ast);
	st.equal(astNodes.length, 1, "nodesAtPosition filtered to a single nodeType");
	*/
	st.end();
    });
});
