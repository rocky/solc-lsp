/**
   Top-level routines for a Language Server Protocal functions. The main class is [[LspManager]].
   Note we are not a Language Server, but just are implementing the library that would be used for
   such a server.
**/
import { compileSolc, getFileContent } from "./solc-compile";
import { truffleConfSnippetDefault } from "./trufstuf";

// import * as solc from "solc";

import { getDefinition, getTypeDefinition } from "./ast-fns";
import { LineColPosition, LineColRange, SolcAstNode, SourceMappings, SolcRange,
         sourceSolcRangeFromSrc } from "./solc-ast";
import { StaticInfo } from "./gather-info";
import { solcRangeFromLineColRange } from "./conversions";

interface LspManagerConfig {
    readonly logger: any;
    readonly useCache: boolean;
}

// FIXME: create an interface with fileInfo stuff.
export type FileInfo = any;

/* Here we have barebones configuration.
*/
const defaultConfig = {
  logger: console, // Where does output go to?
  useCache: true   // If false we force recompilation even if we have AST information from before.
};

/**
 * A LSP manager for Solidity files.
 */
export class LspManager {

  config: LspManagerConfig = { ...defaultConfig };
  fileInfo: FileInfo;

  constructor(config = defaultConfig) {
    this.config = config;
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
  async compile(content: string, solcPath: string,
                options: any = { logger: this.config.logger,
                                 useCache: this.config.useCache,
                               },
                truffleConfSnippet: any = truffleConfSnippetDefault) {

    if (options.useCache && solcPath in this.fileInfo &&
        this.fileInfo[solcPath].content === content) {
      // We've done this before. FIXME: we also need to check that files this
      // imports haven't changed.
      return;
    }

    const logger = {
      ...this.config.logger, ...options.logger
    };

    const compiled = await compileSolc(content, solcPath, logger, truffleConfSnippet);
    if (!compiled) return;

    // Compute sourceList, the list of sources seen.
    let sourceList: Array<string> = [];
    for (const filePath of Object.keys(compiled.sources)) {
      const source = compiled.sources[filePath];
      if ("ast" in source) {
        const fileIndex = source.id;
        sourceList[fileIndex] = filePath;
      }
    }
    compiled.sourceList = sourceList;

    // Fill in gather-info data for *all* imported sources we hit it
    // compilation. Down the line we probably will need to track dependencies
    // And what to do when a dependency changes. Do we recompile code that depends on it?
    // Or wait until we switch to that file?
    // Do we note the "root" contract?
    // Since AST id's are sequentical, the id imported contracts can change depending
    // on where you started from.
    for (const filePath of Object.keys(compiled.sources)) {
      const sourceInfo = compiled.sources[filePath];

      // Note: different projects should have their own LSP manager to reduce
      // sharing of imported contracts.
      this.fileInfo.sourceList = sourceList;

      if ("ast" in compiled.sources[filePath]) {
        let fileContent = (filePath === solcPath) ? content : getFileContent(filePath);

        this.fileInfo[filePath] = {
          ast: sourceInfo.ast,
          content: fileContent,
          sourceList,
          fileIndex: sourceInfo.id,
          sourceMapping: new SourceMappings(fileContent),
          staticInfo: new StaticInfo(sourceInfo.ast)
        };
      }
    }

    if ("contracts" in compiled) {
      this.fileInfo[solcPath].contracts = compiled.contracts;
    }

    // Down the line we'll do better about tracking dependecies. For now
    // we'll just say that sources other than "solcPath" which was given, are dependencies
    // of "solcPath"

    // Add solcIds from imported sources into imported-from solcIds.
    if (solcPath in this.fileInfo) {
      this.fileInfo[solcPath].imported = sourceList.filter((s: string) => s !== solcPath);

      for (const filePath of this.fileInfo[solcPath].imported) {
        this.fileInfo[solcPath].staticInfo.solcIds = {
          ... this.fileInfo[solcPath].staticInfo.solcIds,
          ... this.fileInfo[filePath].staticInfo.solcIds
        };
      };
    };

    return compiled;
  }

  /**
   * Compile `solcStr` associated with `filePath` it has been compiled before.
   *
   * @param solcStr solidity source code contents to compile
   * @param filePath source path that contents might reside at
   * @param compileOptions options to pass to solc
   */
  compileIfNotCompiled(solidityStr: string, filePath: string, compileOptions: any) {
    if (!this.isCompiled(filePath)) this.compile(solidityStr, filePath, compileOptions);
  }

  /**
   * Find a solc AST node that most closely matches the given
   * line/column selection located in filePath. Note here we start out
   * with a single position. See [[solcAstNodeFromLineColRange]] for
   * doing the same starting out with a range.
   *
   * @param filePath file location that the AST node should located in
   * @param selection position that the AST should match or minimally encompass
   * @returns tuple of solcASTNode and its fileInfo (fileInfo first) or null if nothing can be found.
   */
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
   * Find a solc AST node that most closely matches the given
   * line/column selection range in filePath. Note here we start out
   * with a range. See [[solcAstNodeFromLineColPosition]] for doing
   * the same starting out with a single position.
   *
   * @param filePath file location that the AST node should located in
   * @param selection range that the AST should match or minimally encompass
   * @returns tuple of solcASTNode and its fileInfo (fileInfo first) or null if nothing can be found.
   */
  solcAstNodeFromLineColRange(filePath: string, selection: LineColRange
  ): [any, SolcAstNode] | null {
    if (!(filePath in this.fileInfo)) {
      return null;
    }
    const finfo = this.fileInfo[filePath];
    const solcRange = solcRangeFromLineColRange(selection, finfo.sourceMapping.lineBreaks)
    return [finfo, finfo.staticInfo.solcRangeToAstNode(solcRange)];
  }

  /**
   * Find a solc AST node that most closely matches the given solc selection range.
   * See [[solcAstNodeFromLineColRange]] and [[solcAstNodeFromLineColPosition]]
   * for doing the same starting out with line/column ranges.
   *
   * @param filePath file location that the AST node should located in
   * @param selection range that the AST should match or minimally encompass
   * @returns found SolcASTNode or null if nothing can be found
   */
  solcAstNodeFromSolcRange(solcRange: SolcRange
                          ): SolcAstNode | null {
    const filePath = this.fileInfo.sourceList[solcRange.fileIndex];
    const finfo = this.fileInfo[filePath];
    return finfo.staticInfo.solcRangeToAstNode(solcRange);
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
