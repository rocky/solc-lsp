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

/* Trufflish-related code.
 *
 */

const findUp = require('find-up');
import { existsSync, statSync } from "fs";
import { dirname, join } from "path";
/**
 * Solc compilation uses the "compilers" part the information in
 * "truffle_config.js" configuration file. See
 * https://www.trufflesuite.com/docs/truffle/reference/configuration#compiler-configuration
 * We also have some information other than the compilers section, and
 * things that are not part of truffle's config at all.
 *
 *
 * @export
 * @interface TruffleConfigSnippet
 */
export interface TruffleConfigSnippet {
  truffle_directory?: string;  // Solidity source code as a string
  contracts_directory: string;
  compilers: any;
  quiet: boolean;  // Show non-diagnostic errors or not. When we are
                   // autocompiling we don't want compiler-diagnostic
                   // errors.
}

const TRUFFLE_ROOT_DIRS = ["contracts", "migrations"];

/*
 * Our default truffle-like configuration.
 *
 * Note: if `truffle_directory` is `undefined`, then we do not think this is a
 * a truffle project.
 *
 * If `contract_directory` is "" it has not been set yet. It is
 * generally the basename of the program that is to be compiled.
*/
export const truffleConfSnippetDefault: TruffleConfigSnippet = {
  truffle_directory: undefined,
  contracts_directory: "",
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
 * Return true path `truffleProjectDir` seems to be the root of a truffle project.
 * @param truffleProjectDir path to check for truffle root-ness
 */
export function isTruffleRoot(truffleProjectDir: string): boolean {
  for (const shortDir of TRUFFLE_ROOT_DIRS) {
    const dir = join(truffleProjectDir, shortDir);
    if (!existsSync(dir)) {
      return false;
    }
    const stat = statSync(dir);
    if (!stat || !stat.isDirectory()) {
      return false;
    }
  }
  for (const truffleJSBase of ["truffle-config.js", "truffle.js"]) {
    const truffleJSPath = join(truffleProjectDir, truffleJSBase);
    try {
      const stat = statSync(truffleJSPath);
      if (stat && stat.isFile()) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  return false;
}

/**
 * search up from file path `p` looking for a truffle project root.
 * Return root path if found or null if not found.
 * @param startPath file path to start the truffle-project root search.
 */
export function findTruffleRoot(startPath: string): string | undefined {

  let opts: { cwd?: string; path?: string, type: string } = {type: 'directory'};
  try {
    const stat = statSync(startPath);
    if (stat) {
      if (stat.isFile()) {
        opts = {path: startPath,
                cwd: dirname(startPath),
                type: 'directory'};
      } else if (stat.isDirectory()) {
        opts = {cwd: startPath, type: 'directory'};
      }
    }
  } catch (e) {
    return undefined;
  }

  return findUp.sync((directory: string) =>
                     isTruffleRoot(directory) ? directory : undefined,
                     opts);
}

/**
  * Not all things we want to compile are truffle projects.
  * However we want to try to leverage truffle's libraries as much as possible.
  *
  * Here we "normalize", fill out, or fake up truffle-like configuration information.
  *
  * @param solcSourcePath Solidity source code path name
  * @param snippetConf the truffle snippet will be normalized
  */
export function truffleConfSnippetNormalize(solcSourcePath: string, snippetConf: TruffleConfigSnippet) {

  if (snippetConf.truffle_directory === undefined) {
    snippetConf.truffle_directory = findTruffleRoot(solcSourcePath);
  }

  if (snippetConf.contracts_directory === undefined) {
          snippetConf.contracts_directory = dirname(solcSourcePath);
  }

  if (snippetConf.compilers.solc.version === null) {
    snippetConf.compilers.solc.version = truffleConfSnippetDefault.compilers.solc.version;
  }

  if (snippetConf.compilers.solc.setting === null) {
    snippetConf.compilers.solc.settings = {};
  }

}
