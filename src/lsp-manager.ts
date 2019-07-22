import { compileSolc, truffleConfSnippetDefault } from "./solc-compile";

// import * as solc from "solc";

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
  async compile(content: string, path: string,
                options: any = { logger: this.config.logger,
                                 useCache: this.config.useCache,
                                 solcStandardInput: {},
                               },
                truffleConfSnippet: any = truffleConfSnippetDefault) {

    if (options.useCache && path in this.fileInfo &&
        this.fileInfo[path].content === content) {
      // We've done this before.
      return;
    }

    const logger = {
      ...this.config.logger, ...options.logger
    };

    const compiled = await compileSolc(content, path, logger, options.solcStandardInput,
                                       truffleConfSnippet);
    if (!compiled) return;
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
