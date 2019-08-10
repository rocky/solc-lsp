#!/usr/bin/env node
/* Compile a solidity file and show just the first AST it produces.
   This can be useful for saving ASTs.
*/
const fs = require("fs");
const path = require("path");
const util = require("util");
const solcCompile = require("../out/solc-compile"); // Or something like this

if (process.argv.length < 2) {
    console.log('Usage: ' + __filename + ' <solidity_json>');
    process.exit(-1);
}

// const filePath = path.join(__dirname, "../tests/resources/oz-example/contracts/ERC20.sol");
let filePath = path.join(__dirname, "../tests/resources/array.sol");
if (process.argv.length == 3) {
    filePath = process.argv[2];
}

let res;
const content = solcCompile.getFileContent(filePath);

try {
    solcCompile.compileSolc(content, filePath, console.log).then((compiled) => {
	if ("ast" in compiled) {
	    const ast = compiled.sources[Object.keys(compiled.sources)[0]].ast
	    console.log(JSON.stringify(ast, null, 2));
	} else if ("errors" in compiled) {
	    for (err of compiled.errors) {
		console.log(err.formattedMessage);
	    }
	}
    });
} catch (e) {
    console.log(e);
}
