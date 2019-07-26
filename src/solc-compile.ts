/*
 * Functions involving compiling Solidity using solc with help from truffle, get-installed--path.
 *
 * Just about everybody who uses solc has their own "compile" module. _Ours_ is the true general-purpose solc compile.
 */
import { statSync, readFileSync } from "fs";
const CompilerSupplier = require("truffle-compile/compilerSupplier");
import { basename, dirname, isAbsolute, normalize, sep } from "path";
const detectInstalled = require('detect-installed');
const { getInstalledPathSync } = require('get-installed-path');

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

function resolveNPM(pathName: string, cwd: string): string {
  let packageName: string;
  if (pathName.startsWith(sep)) {
    packageName = pathName.split(sep)[1];
  } else {
    packageName = pathName.split(sep)[0];
  }
  if (detectInstalled.sync(packageName, {local: true, cwd})) {
    return getInstalledPathSync(packageName, {local: true, cwd});
  } else {
    if (basename(cwd) === "contracts") {
      return getInstalledPathSync(packageName, {local: true, cwd: dirname(cwd)});
    }
    throw "Can't find as NPM package";
  }
}

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

  /**
   * Called back by the solc when there is an import.
   *
   * FIXME: Here we do the simplest, stupidist thing and just look
   * up the name. You can imagine more sophisticated mechanisms.
   *
   */
  function getImports(pathName: string) {
    try {
      const cwd = truffleConfSnippet.contracts_directory;
      if (!isAbsolute(pathName))
        pathName = cwd + pathName;
	    pathName = normalize(pathName);

      try {
        const stat = statSync(pathName);
        if (!stat.isFile()) {
          // Do we have an NPM-installed local or global directory?
          pathName = resolveNPM(pathName, cwd);
        }
      } catch {
        // Do we have an NPM-installed local or global directory?
        pathName = resolveNPM(pathName, cwd);
      }
      // Check if this comes from an an npm package.
      /// Add isInstalled and get-installed-path here.
      return {
        contents: getFileContent(pathName)
      };
    } catch (e) {
      return {
        error: `${e.message}`
      }
    }
  }

  if (truffleConfSnippet.contracts_directory === null) {
    truffleConfSnippet.contracts_directory = process.cwd();
  }

  if (!truffleConfSnippet.contracts_directory.endsWith(sep))
    truffleConfSnippet.contracts_directory + sep;

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
