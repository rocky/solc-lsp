/*
 * Functions involving compiling Solidity using solc with help from truffle, get-installed--path.
 *
 * Just about everybody who uses solc has their own "compile" module. _Ours_ is the true general-purpose solc compile.
 */
import { statSync, readFileSync } from "fs";

const CompilerSupplier = require("truffle-compile/compilerSupplier");
const { getInstalledPathSync } = require('get-installed-path');

import { dirname, isAbsolute, join, normalize, sep } from "path";
import { truffleConfSnippetNormalize, truffleConfSnippetDefault } from "./trufstuf";

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
 * @param content the Solidity source-code string. Note it might not reside in the filesystem (yet)
 * @param sourcePath the place where the source-code string may eventually wind up
 * @param logger log function
 * @param truffleConfSnippetDefault part of a truffle configuration that includes the "compilers"
 *                                  and "contracts_directory" attribute. See [[truffleConfsnippetdefault]]
 *                                  for such an object.
 */
//
export async function compileSolc(content: string, sourcePath: string, logger: any,
  truffleConfSnippet = truffleConfSnippetDefault
): Promise<any> {

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
        } catch(_) { };
      }
	    pathName = normalize(pathName);

      try {
        const stat = statSync(pathName);
        if (!stat.isFile() && truffleConfSnippet.truffle_directory) {
          // Do we have an NPM-installed local or global directory?
          const dir = resolveNPM(pathName, truffleConfSnippet.truffle_directory);
          // the final directory name is repeated, so remove that.
          pathName = join(dirname(dir), pathName);
        }
      } catch {
        // Do we have an NPM-installed local or global directory?
        if (truffleConfSnippet.truffle_directory) {
          const dir = resolveNPM(pathName, truffleConfSnippet.truffle_directory);
          // the final directory name is repeated, so remove that.
          pathName = join(dirname(dir), pathName);
        } else {
          return { error: "Not an NPM import" }
        }
      }
      return {
        contents: getFileContent(pathName)
      };
    } catch (e) {
      return { error: `${e.message}` }
    }
  }

  truffleConfSnippetNormalize(sourcePath, truffleConfSnippet);

  const supplier = new CompilerSupplier(truffleConfSnippet.compilers.solc);
  let solc: any;
  ({ solc } = await supplier.load());
  const solcStandardInput: any = {
    ...{
      "language": "Solidity",
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

  if (solc.version() >= "0.5.10" &&
      !("parserErrorRecovery" in solcStandardInput.settings)) {
    // Set for extended errors
    solcStandardInput.settings.parserErrorRecovery = true;
  }

  try {
    return solc.compile(JSON.stringify(solcStandardInput), getImports);
  } catch (err) {
    logger.log(err);
    return null;
  }
}
