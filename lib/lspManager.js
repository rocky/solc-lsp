"use strict";

// import * as solc from "solc";
const solc = require("solc");

class LspManager {

  constructor () {
	  // Key is by path
	  this.fileInfo = {}
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
	  }
    const compiled = solc.compile(JSON.stringify(solcStandardInput));
    try {
	    const compiledJSON = JSON.parse(compiled)
	    if (path in compiledJSON.sources) {
		    if ('ast' in compiledJSON.sources[path]) {
		      this.fileInfo[path] = {
			      ast: compiledJSON.sources[path].ast,
			      source: solidityStr
          }
        }
      }
	    debugger;
	    return compiledJSON;
	  } catch(err) {
	    // FIXME: fill in something more meaningful
	    console.log(err);
	    debugger;
	    return {};
	  }
  }

  gotoDefinition(path, selection) {
	  debugger;
	  if (path in this.fileInfo) {
	    const info = this.fileInfo[path];
	    if (! ('sourceMappingDecoder' in info)) {
		    this.info.sourceMappingDecoder = new SourceMappingDecoder();
		    this.info.lineBreakPositions = smd.getLinebreakPositions(info.source);
	    }
	    return astFns.getDefinitionLocations(info, selection);
	    console.log(`To be continued...`);
	  } else {
	    console.log(`Information about ${path} not found`);
	  }
	  return;
  }
}

module.exports.LspManager = LspManager;
