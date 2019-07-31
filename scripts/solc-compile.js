#!/usr/bin/env node
/*
   Yet another routine to compile a Solidity file.
*/
const lspM = require("../out"); // Or something like this
const fs = require('fs');
const util = require('util');

if (process.argv.length != 3) {
    console.log('Usage: ' + __filename + ' <solidity_file>');
    process.exit(-1);
}

const lspConfig = {};
const lspMgr = new lspM.LspManager(lspConfig);

let solidity_code;
const solidity_file = process.argv[2];

try {
  solidity_code = fs.readFileSync(solidity_file, 'utf8');
} catch (err) {
    console.log('Error opening input file' + err.message);
    process.exit(-1);
}

lspMgr.compile(solidity_code, solidity_file).then((compiled) => {
    console.log(util.inspect(compiled));
    if (!compiled.contracts) {
	if (compiled.errors) {
            for (const compiledError of compiled.errors) {
		console.log(compiledError.formattedMessage);
            }
	}
	process.exit(-1);
    }

    if (compiled.contracts.inputfile.length === 0) {
	console.log('No contracts found');
	process.exit(-1);
    }
});
