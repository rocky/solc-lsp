"use strict";

// import * as solc from "solc";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solc = require("solc");
const remixAST = require("../node_modules/remix-astwalker/dist");

import { getDefinition, getTypeDefinition } from "./astFns";
import { LineColRange } from "./types";

export class LspManager {

  fileInfo: any;

  constructor() {
    // Key is by path
    this.fileInfo = {};
  };


  compile(solidityStr: string, path: string, options: any) {
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
    } catch (err) {
      // FIXME: fill in something more meaningful
      console.log(err);
      return {};
    }
  }

  gotoDefinition(path: string, selection: LineColRange) {
    if (path in this.fileInfo) {
      const finfo = this.fileInfo[path];
      return getDefinition(finfo, selection);
    } else {
      console.log(`Information about ${path} not found`);
    }
    return null;
  }

  gotoTypeDefinition(path: string, selection: LineColRange) {
    if (path in this.fileInfo) {
      const finfo = this.fileInfo[path];
      return getTypeDefinition(finfo, selection);
    } else {
      console.log(`Information about ${path} not found`);
    }
    return null;
  }

}
