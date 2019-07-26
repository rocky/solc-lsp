/*
 * Functions involving compiling Solidity using solc with help from truffle.
 */
import { statSync, readFileSync } from "fs";
const CompilerSupplier = require("truffle-compile/compilerSupplier");
import { isAbsolute, normalize } from "path";

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

/**
 * Our compile options use a form that is compatible with [truffle](https://www.trufflesuite.com/truffle).
 */
export const truffleConfSnippetDefault = {
  contracts_directory: null,
  compilers: {
    solc: {
      version: "0.5.10",
      // Note that this is called standardInputOpts.settings in solc terminology
      settings: {
        optimizer: {
          enabled: false,
          runs: 0
        }
      }
    }
  },
  quiet: true
};

/**
 * Compile solidity source according to our particular setting.
 *
 * @param content the Solidity source-code string. Note it might not reside in the filesystem (yet)
 * @param solcPath the place where the source-code string may eventually wind up
 * @param logger log function
 * @param truffleConfSnippetDefault part of a truffle configuration that includes the "compilers"
 *                                  and "contracts_directory" attribute. See [[truffleConfsnippetdefault]]
 *                                  for such an object.
 */
//
export async function compileSolc(content: string, solcPath: string, logger: any,
  truffleConfSnippet: any = truffleConfSnippetDefault
): Promise<any> {

  let cwd = process.cwd();
  if (!cwd.endsWith("/")) cwd += "/";

  /**
   * Called back by the solc when there is an import.
   *
   * FIXME: Here we do the simplest, stupidist thing and just look
   * up the name. You can imagine more sophisticated mechanisms.
   *
   */
  function getImports(pathName: string) {
    try {
      if (!isAbsolute(pathName)) pathName = cwd + pathName;
      pathName = normalize(pathName);
      return {
        contents: getFileContent(pathName)
      };
    } catch (e) {
      return {
        error: `${e.mssage}`
      }
    }
  }

  if (truffleConfSnippet.compilers.solc.version === null) {
    truffleConfSnippet.compilers.solc.version = truffleConfSnippetDefault.compilers.solc.version;
  }
  if (truffleConfSnippet.compilers.solc.setting === null) {
    truffleConfSnippet.compilers.solc.settings = {};
  }
  const supplier = new CompilerSupplier(truffleConfSnippet.compilers.solc);
  let solc: any;
  ({ solc } = await supplier.load());
  const solcStandardInput: any = {
    ...{
      "language": "Solidity",
      sources: { [solcPath]: { content } },
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
