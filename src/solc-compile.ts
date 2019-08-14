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

/*
 * Functions involving compiling Solidity using solc with help from truffle, get-installed--path.
 *
 * Just about everybody who uses solc has their own "compile" module. _Ours_ is the true general-purpose solc compile.
 */
import { statSync, readFileSync } from "fs";

import compilerSupplier = require("truffle-compile/compilerSupplier");
const { getInstalledPathSync } = require('get-installed-path');

import { dirname, isAbsolute, join, normalize, sep } from "path";
import { truffleConfSnippetNormalize, TruffleConfigSnippet,
         truffleConfSnippetDefault } from "./trufstuf";

export interface SolcError {
    sourceLocation?: {
        file: string;
        start: number;
        end: number;
    };
    type: string;  // e.g. ParserError, TypeError...
    component: string;  // general
    severity: "error" | "warning";
    message: string;
    formattedMessage: string;
}

/**
  * remove some of the jargon from nodejs fs.stat messages
*/
function fixupStatMessage(err: any) {
  if (err.message) {
    if (err.message.startsWith("ENOENT: n")) {
      err.message = err.message.replace("ENOENT: n", "N").replace(", stat ", ". Looked for: ");
    } else if (err.message.startsWith("EISDIR: ")) {
      err.message = err.message.replace("EISDIR: ", ": ");
    }
  }
}

/**
  * Reads (Solidity) file passed and returns the
  * contents of that file.
  *
  * FIXME: This could be made asynchronous for better performance.
  */
export function getFileContent(filePath: string) {
  const stats = statSync(filePath);
  if (stats.isFile()) {
    return readFileSync(filePath).toString();
  } else {
    throw `File "${filePath}" not found`;
  }
}

function resolveNPM(pathName: string, truffleRoot: string): string {
  let packageName: string;
  if (pathName.startsWith(sep)) {
    packageName = pathName.split(sep)[1];
  } else {
    packageName = pathName.split(sep)[0];
  }
  return getInstalledPathSync(packageName, {local: true, cwd: truffleRoot});
}

/**
 * Compile solidity source according to our particular setting.
 *
 * @param sourcePath The place where the source-code string may eventually wind up.
 * @param content The Solidity source-code string. Note it might not reside in the filesystem (yet)
 *                If content is undefined, we will get the content by reading from the filesystem.
 * @param truffleConfSnippetDefault part of a truffle configuration that includes the "compilers"
 *                                  and "contracts_directory" attribute. See [[truffleConfsnippetdefault]]
 *                                  for such an object.
 */
//
export async function solc(sourcePath: string, content?: string,
                           truffleConfSnippet: TruffleConfigSnippet = truffleConfSnippetDefault
): Promise<any> {

  interface ImportRemap {
    [importName: string]: string;
  }

  const importRemap: ImportRemap = {};
  if (content === undefined) {
    content = getFileContent(sourcePath);
  }

  /**
   * Called back by the solc when there is an import.
   * We currently handle NPM local and global packages such as from
   * openzeppelin.
   *
   * FIXME: handle epm and other things?
   *
   * @param pathName the file name we are trying to resolve
   */
  function getImports(pathName: string): any {
    try {
      const cwd = truffleConfSnippet.contracts_directory;
      if (!isAbsolute(pathName)) {
        const pathNameTry = join(cwd, pathName);
        try {
          if (statSync(pathName).isFile()) {
            pathName = pathNameTry;
          }
        } catch (_) { }
      }
      let pathNameResolved = normalize(pathName);

      try {
        const stat = statSync(pathNameResolved);
        if (!stat.isFile() && truffleConfSnippet.truffle_directory) {
          // Do we have an NPM-installed local or global directory?
          const dir = resolveNPM(pathName, truffleConfSnippet.truffle_directory);
          // the final directory name is repeated, so remove that.
          pathName = join(dirname(dir), pathNameResolved);
        }
      } catch {
        // Do we have an NPM-installed local or global directory?
        if (truffleConfSnippet.truffle_directory) {
          const dir = resolveNPM(pathNameResolved, truffleConfSnippet.truffle_directory);
          // the final directory name is repeated, so remove that.
          pathNameResolved = join(dirname(dir), pathNameResolved);
        } else {
          return { error: "Not an NPM import" };
        }
      }
      if (pathName !== pathNameResolved) {
        importRemap[pathName] = pathNameResolved;
      }
      return {
        contents: getFileContent(pathNameResolved)
      };
    } catch (e) {
      fixupStatMessage(e);
      return { error: `${e.message}` };
    }
  }

  truffleConfSnippetNormalize(sourcePath, truffleConfSnippet);

  const supplier = new compilerSupplier(truffleConfSnippet.compilers.solc);
  let solc: any;
  ({ solc } = await supplier.load());
  const solcStandardInput: any = {
    ...{
      language: "Solidity",
      sources: { [sourcePath]: { content } },
      settings: {
        // Of the output produced, what part of it?
        outputSelection: {
          "*": {
            "": ["ast"] // Just return the AST - nothing else
          }
        },
        optimizer: {
          enabled: false // We just want AST info, no optimizer please.
        }, ...truffleConfSnippet.compilers.solc.settings
      }
    }
  };

  // Drop "+commit..." from version if it exists
  const solcVersion = solc.version().split("+")[0]; //
  if (solcVersion >= "0.5.10" &&
      !("parserErrorRecovery" in solcStandardInput.settings)) {
    // Set for extended errors
    solcStandardInput.settings.parserErrorRecovery = true;
  }

  try {
    const compiledJSON = solc.compile(JSON.stringify(solcStandardInput), getImports);
    const compiled = JSON.parse(compiledJSON);
    // Fill in resolved input in sources.
    for (const source of Object.keys(compiled.sources)) {
      if (source in importRemap) {
        const remapName = importRemap[source];
        delete Object.assign(compiled.sources, {[remapName]: compiled.sources[source]})[source];
        compiled.sources[remapName].importName = source;
      }
    }
    return { ...compiled, cached: false, solcVersion };
  } catch (err) {
    let mess = "undisclosed error";
    if (typeof err === "string") {
      mess = err;
    } else if ("message" in err) {
      err = err.message;
    }
    fixupStatMessage(err);
    return {
      cached: false,
      solcVersion,
      errors: [
          <SolcError>{
            type: "GeneralError",
            severity: "error",
            message: mess,
            formattedMessage: mess
          }
      ] };
  }
}
