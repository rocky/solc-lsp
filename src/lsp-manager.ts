"use strict";
import { statSync, readFileSync } from "fs";

// import * as solc from "solc";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solc = require("solc");

import { getDefinition, getTypeDefinition } from "./ast-fns";
import { LineColPosition, LineColRange, SolcAstNode, SourceMappings, SolcRange,
         sourceSolcRangeFromSrc } from "./solc-ast";
import { StaticInfo } from "./gather-info";

/* Here we have barebones configuration.
*/
const default_config = {
  logger: console, // Where does output go to?
  useCache: true   // If false we force recompilation even if we have AST information from before.
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


  isCompiled(path: string): boolean {
    return path in this.fileInfo;
  }

  /**
   * Compile solidity source according to our particular setting.
   *
   * @param content the Solidity source-code string. Note it might not reside in the filesystem (yet)
   * @param path the place where the source-code string may eventually wind up
   * @param path compile options
   */
  //
  compile(content: string, path: string, options:
	  any = { logger: this.config.logger,
		  useCache: this.config.useCache
		}) {

    let logger = {
      ...this.config.logger, ...options.logger
    };

    if (options.useCache && path in this.fileInfo &&
	this.fileInfo[path].content === content) {
      // We've done this before.
      return;
    }

    const sources = {
      [path]: {
        // Content field is what solc uses. The other fields we have here should be ignored.
        content
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

    if (solc.version() >= '0.5.10' &&
      !solcStandardInput.settings.parserErrorRecovery) {
      // Set for extended errors
      solcStandardInput.settings.parserErrorRecovery = true;
    }

    let compiled: any;
    try {
      compiled = solc.compile(JSON.stringify(solcStandardInput), getImports);
    } catch (err) {
      logger.log(err);
      return {};
    }
    try {
      const compiledJSON = JSON.parse(compiled);
      let sourceList: Array<string> = [];
      for (const filePath of Object.keys(compiledJSON.sources)) {
	const source = compiledJSON.sources[filePath];
        if ("ast" in source) {
	  const fileIndex = source.id;
	  sourceList[fileIndex] = filePath;
	}
      }
      compiledJSON.sourceList = sourceList;
      if (path in compiledJSON.sources) {
        const sourceInfo = compiledJSON.sources[path];

	// FIXME: we might need to do something about different workspaces or
	// different collections of files.
	this.fileInfo.sourceList = sourceList;

        if ("ast" in compiledJSON.sources[path]) {
          this.fileInfo[path] = {
            ast: sourceInfo.ast,
            content,
	    sourceList,
	    fileIndex: sourceInfo.id,
            sourceMapping: new SourceMappings(content),
            staticInfo: new StaticInfo(sourceInfo.ast)
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

  compileIfNotCompiled(solidityStr: string, path: string, options: any) {
    if (!this.isCompiled(path)) this.compile(solidityStr, path, options);
  }

  solcAstNodeFromLineColPosition(filePath: string, selection: LineColPosition
  ): [any, SolcAstNode] | null {
    if (!(filePath in this.fileInfo)) {
      return null;
    }
    const finfo = this.fileInfo[filePath];
    const solcOffset = finfo.sourceMapping.offsetFromLineColPosition(selection);
    return [finfo, finfo.staticInfo.offsetToAstNode(solcOffset)];
  }

  /**
   * Retrieve the text for the given solcRange.
   *
   * @param solcRange the object containing attributes {source}, {length} and {fileIndex}.
   */
  textFromSolcRange(solcRange: SolcRange): string {
    const filePath = this.fileInfo.sourceList[solcRange.fileIndex];
    if (filePath in this.fileInfo)
      return this.fileInfo[filePath].content.slice(solcRange.start, solcRange.start + solcRange.length);
    else
      return '';
  }

  /**
   * Retrieve the text for the given solcRange.
   *
   * @param src the object containing attributes {source}, {length} and {fileIndex}.
   */
  textFromSrc(src: string): string {
    return this.textFromSolcRange(sourceSolcRangeFromSrc(src));
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
