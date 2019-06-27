"use strict";
import { statSync, readFileSync } from 'fs';

// import * as solc from "solc";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solc = require("solc");

import { getDefinition, getTypeDefinition } from "./ast-fns";
import { LineColRange, SourceMappings } from "./solc-ast";

/* Here we have barebones configuration.
*/
const default_config = {
  logger: console
};

/**
  * Reads (Solidity) file passed and returns the
  * contents of that file.
  *
  * FIXME: This could be made asynchronous for better performance.
*/
export function getFileContent(filepath: string) {
  const stats = statSync(filepath);
  if (stats.isFile()) {
    return readFileSync(filepath).toString();
  } else {
    throw `File "${filepath}" not found`;
  }
}

/**
 * Called back by the solc when there is an import.
 *
 * FIXME: Here we do the simplest, stupidist thing and just look
 * up the name. You can imagine more sophisticated mechanisms.
 *
 */
function getImports(pathName: string) {
  try {
    return { contents: getFileContent(pathName) };
  } catch (e) {
    return {
      error: `${e.mssage}`
    }
  }
}


/**
 * A LSP manager for Solidity files.
 */
export class LspManager {

  config = { ...default_config };
  fileInfo: any;

  constructor(config: any) {
    this.config = { ...config, ...default_config };
    this.fileInfo = {};
  };


  compile(solidityStr: string, path: string, options:
    any = { logger: this.config.logger }) {

    let logger = {
      ...this.config.logger, ...options.logger
    };

    const sources = {
      [path]: {
        // Content field is what solc uses. The other fields we have here should be ignored.
        "content": solidityStr,
      }
    };


    const solcStandardInput = {
      ...{
        "language": "Solidity",
        sources: sources,  // Note: "content" set above.
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
      }, ...options.solcStandardInput
    };

    let compiled: any;
    try {
      compiled = solc.compile(JSON.stringify(solcStandardInput), getImports);
    } catch (err) {
      logger.log(err);
      return {};
    }
    try {
      const compiledJSON = JSON.parse(compiled);
      if (path in compiledJSON.sources) {
        const sourceInfo = compiledJSON.sources[path];
        if ('ast' in compiledJSON.sources[path]) {
          this.fileInfo[path] = {
            content: solidityStr,
            ast: sourceInfo.ast,
            sourceMapping: new SourceMappings(solidityStr)
          };
        }
      }
      return compiledJSON;
    } catch (err) {
      // FIXME: fill in something more meaningful
      logger.log(err);
      return {};
    }
  }

  gotoDefinition(path: string, selection: LineColRange) {
    if (path in this.fileInfo) {
      const finfo = this.fileInfo[path];
      return getDefinition(finfo, selection);
    } else {
      this.config.logger.log(`Information about ${path} not found`);
    }
    return null;
  }

  gotoTypeDefinition(path: string, selection: LineColRange) {
    if (path in this.fileInfo) {
      const finfo = this.fileInfo[path];
      return getTypeDefinition(finfo, selection);
    } else {
      this.config.logger.log(`Information about ${path} not found`);
    }
    return null;
  }

}
