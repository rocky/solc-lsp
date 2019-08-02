#!/usr/bin/env node
/* Show gather-info information. */
const fs = require("fs");
const path = require("path");

const gather = require("../out/gather-info");
// const solidityAst = __dirname + "/../tests/resources/ast.json";

if (process.argv.length !== 3) {
    console.log('Usage: ' + __filename + ' <solidity_json>');
    process.exit(-1);
}

solidityAst = process.argv[2];

const ast = JSON.parse(fs.readFileSync(solidityAst, 'utf8'));
debugger;

const g = new gather.StaticInfo(ast);
const util = require("util");
const x = util.inspect(g, {depth: 4});
console.log(x);

// for (let offset of [62, 59]) {
//    let node = g.offsetToAstNode(offset);
//    if (node.typeName && node.typeName.name) {
//       console.log(`offset ${offset} ${node.nodeType} node at ${node.src} has type ${node.typeName.name}`);
//    } else if (node.typeDescriptions && node.typeDescriptions.typeString) {
//       console.log(`offset ${offset} ${node.nodeType} node at ${node.src} has is type description ${node.typeDescriptions.typeString}`);
//    } else {
//        console.log(`node at ${node.src} is ${node.nodeType}`);
//        //console.log(util.inspect(node));
//    }
// }
