/* Copyright 2919 Rocky Bernstein

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
   Top-level routines for a Language Server Protocal functions. The main class is [[LspManager]].
   Note we are not a Language Server, but just are implementing the library that would be used for
   such a server.
**/
import { solc, getFileContent } from "./solc-compile";
import { truffleConfSnippetDefault } from "./trufstuf";

// import * as solc from "solc";

import { getDefinition, getTypeDefinition } from "./ast-fns";
import { LineColPosition, LineColRange, SolcAstNode, SourceMappings, SolcRange,
         sourceSolcRangeFromSrc } from "./solc-ast";
import { StaticInfo } from "./gather-info";
import { solcRangeFromLineColRange } from "./conversions";

export interface LspManagerConfig {
  logger: Console;
  readonly useCache: boolean;
}

export interface FileInfoStruct {
  ast: SolcAstNode
  content: string,
  contracts?: string[],
  sourceList: string[],
  fileIndex: number,
  imported?: string[],
  sourceMapping: any,
  staticInfo: StaticInfo
}

export interface FileInfo {
  [path: string]: any // FIXME: should be: FileInfoStruct;
}


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
   * @param content The Solidity source-code string. Note it might not reside in the filesystem (yet)
   * @param sourcePath The place where the source-code string may eventually wind up.
   *                   If content is undefined, we will get the content by reading from the filesystem.
   * @param options Additional options for this routine, e.g. whether to cache results, and what log routine to use
   * @param truffleConfSnippet Section of truffle configuration related to solc compilation, e.g. version and optimization level.
   */
  //
  async compile(sourcePath: string, content?: string,
                options: any = { logger: this.config.logger,
                                 useCache: this.config.useCache,
                               },
                truffleConfSnippet: any = truffleConfSnippetDefault) {

    if (content === undefined) {
      content = getFileContent(sourcePath)
    }

    if (options.useCache
        && sourcePath in this.fileInfo
        && this.fileInfo[sourcePath].content === content
        && this.fileInfo[sourcePath].staticInfo.solcVerson ==  truffleConfSnippet.compilers.solc.version
       ) {
      // We've done this before. FIXME: we also need to check that files this
      // imports haven't changed.
      const finfo = this.fileInfo[sourcePath]
      return {
        sourceList: finfo.sourceList,
        contracts: finfo.contracts,
        cached: true,
      }
    }

    const compiled = await solc(sourcePath, content, truffleConfSnippet);
    if (!compiled || !("sources" in compiled)) return compiled;

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
        let fileContent = (filePath === sourcePath) ? content : getFileContent(filePath);

        this.fileInfo[filePath] = {
          ast: sourceInfo.ast,
          content: fileContent,
          sourceList,
          fileIndex: sourceInfo.id,
          sourceMapping: new SourceMappings(fileContent),
          staticInfo: new StaticInfo(sourceInfo.ast, compiled.solcVersion)
        };
      }
    }

    if ("contracts" in compiled) {
      this.fileInfo[sourcePath].contracts = compiled.contracts;
    }

    // Down the line we'll do better about tracking dependecies. For now
    // we'll just say that sources other than "sourcePath" which was given, are dependencies
    // of "sourcePath"

    // Add solcIds from imported sources into imported-from solcIds.
    if (sourcePath in this.fileInfo) {
      this.fileInfo[sourcePath].imported = sourceList.filter((s: string) => s !== sourcePath);

      for (const filePath of this.fileInfo[sourcePath].imported) {
        this.fileInfo[sourcePath].staticInfo.solcIds = {
          ... this.fileInfo[sourcePath].staticInfo.solcIds,
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
    if (!this.isCompiled(filePath)) this.compile(filePath, solidityStr, compileOptions);
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
    if (solcOffset == null) return null;
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
  ): [FileInfoStruct, SolcAstNode] | null {
    if (!(filePath in this.fileInfo)) {
      return null;
    }
    const finfo = this.fileInfo[filePath];
    const solcRange = solcRangeFromLineColRange(selection, finfo.sourceMapping.lineBreaks)
    if (solcRange == null) return null;
    return <[FileInfoStruct, SolcAstNode] | null>[finfo, finfo.staticInfo.solcRangeToAstNode(solcRange)];
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
    if (!(filePath in this.fileInfo)) {
      return null;
    }
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
      return "";
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
