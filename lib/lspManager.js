"use strict";

// import * as solc from "solc";
const solc = require("solc");
const astFns = require("./astFns");
const remixAST = require("../node_modules/remix-astwalker/dist");

class LspManager {

  constructor () {
	  // Key is by path
	  this.fileInfo = {};
  };


  compile(solidityStr, path, options) {
	  if (options.logger === undefined)
	    options.logger = console;
	  const sources = {};
	  sources[path] = {
	    "content": solidityStr,
	  };

	  const solcStandardInput = {
	    "language": "Solidity",
	    sources: sources,
	    settings: {
		    // Of the output produced, what part of it?
		    outputSelection: {
		      "*": {
			      "": ["ast"] // Just return the AST - nothing else
		      }
		    },
		    optimizer: {
		      enabled: false // Since we just want AST info, no optimizer please.
		    }
	    }
	  };
    const compiled = solc.compile(JSON.stringify(solcStandardInput));
    try {
	    const compiledJSON = JSON.parse(compiled);
	    if (path in compiledJSON.sources) {
		    if ('ast' in compiledJSON.sources[path]) {
		      this.fileInfo[path] = {
			      ast: compiledJSON.sources[path].ast,
			      sourceMapping: new remixAST.SourceMappings(solidityStr)
          };
        }
      }
	    return compiledJSON;
	  } catch(err) {
	    // FIXME: fill in something more meaningful
	    console.log(err);
	    return {};
	  }
  }

  gotoDefinition(path, selection) {
	  if (path in this.fileInfo) {
	    const finfo = this.fileInfo[path];
	    return astFns.getDefinition(finfo, selection);
	    // return astFns.getDefinitionLocations(info, selection);
	  } else {
	    console.log(`Information about ${path} not found`);
	  }
	  return null;
  }

  gotoTypeDefinition(path, selection) {
	  if (path in this.fileInfo) {
	    const finfo = this.fileInfo[path];
	    return astFns.getTypeDefinition(finfo, selection);
	  } else {
	    console.log(`Information about ${path} not found`);
	  }
	  return null;
  }

}

module.exports.LspManager = LspManager;
