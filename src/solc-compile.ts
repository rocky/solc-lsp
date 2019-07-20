/*
 * Functions around compiling Solidity using solc.
 */
import { statSync, readFileSync } from "fs";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solc = require("solc");

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
 * Compile solidity source according to our particular setting.
 *
 * @param content the Solidity source-code string. Note it might not reside in the filesystem (yet)
 * @param path the place where the source-code string may eventually wind up
 * @param logger log function
 * @param standardInputOpts other solc input options.
 */
//
export function compileSolc(content: string, path: string, logger: any,
                            standardInputOpts): any {

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
