/*
 * Functions involving compiling Solidity using solc with help from truffle.
 */
import { statSync, readFileSync } from "fs";
const CompilerSupplier = require("truffle-compile/compilerSupplier");
import {isAbsolute, normalize} from "path";

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

const truffleConfSnippetDefault = {
  contracts_directory: null,
  compilers: {
    solc: {
      version: "0.5.10",
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
 * @param standardInputOpts other solc input options.
 */
//
export async function compileSolc(content: string, solcPath: string, logger: any,
                                  standardInputOpts: any,
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
  function getImports(pathName) {
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


  const supplier = new CompilerSupplier(truffleConfSnippet.compilers.solc);
  let solc: any;
  ({ solc } = await supplier.load());
  const solcStandardInput = {
    ...{
      "language": "Solidity",
      sources: { [solcPath]: { content  } },
      settings: {
        // Of the output produced, what part of it?
        outputSelection: {
          "*": {
            "": ["ast"] // Just return the AST - nothing else
          }
        },
        optimizer: {
          enabled: false // We just want AST info, no optimizer please.
        }
      }
    }, ...standardInputOpts
  };

  if (solc.version() >= '0.5.10' &&
      !solcStandardInput.settings.parserErrorRecovery) {
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
