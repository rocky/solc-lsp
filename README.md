[![CircleCI](https://circleci.com/gh/rocky/solc-lsp.svg?style=svg)](https://circleci.com/gh/rocky/solc-lsp)

Solidity Language Server Functions
----------------------------------

Here we have "Language Server" functions for [Solidity](https://solidity.readthedocs.io/) via the _npm_ package [`solc`](https://www.npmjs.com/package/solc).
The functions are the underlying workhorse function that would be used to implement the Microsoft Language Server Protocol Specification which is defined [here](https://microsoft.github.io/language-server-protocol/specification).

To get started and make sure what we have is complete, there is a prototype using this on the client side to provide a [VSCode extension for Solidity](https://github.com/rocky/vscode-solidity).

I hope to incorporate this in the [remix](https://remix-ide.readthedocs.io/en/latest/), [etheratom](https://atom.io/packages/etheratom), [VSCode solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity) and other JavaScript projects that benefit from the information in Solidity's AST.


# Prerequisites...

You need to have installed:

* [nodejs](https://nodejs.org/en/). Use node version 10.x Node version 12 cannot be used. See below for details
* [npm](https://www.npmjs.com/get-npm)

## Node version 12 and VSCode Problems

One of the npm dependencies is `solc`. This _npm_ package has a dependency on the [`scrypt`](https://www.npmjs.com/package/scrypt) cryptographic package. Nodejs version 12
doesn't work with this. See https://github.com/barrysteyn/node-scrypt/issues/193. I developed and tested this on node version 10.16.0.

When used as a client library with the VSCode extension, I also needed to replace `script.js` with `script-js` which is currently in the `web3-eth-accounts` package.  Otherwise, VSCode will crash silently. When used inside VSCode with the language server protocol, this won't happen.


# Installing from NPM

```console
$ npm  install solc-lsp
```

# Installing from the github repository

Clone the repository.

```console
$ git clone https://github.com/rocky/solc-lsp.git
Cloning into 'solc-lsp
remote: Enumerating objects: 169, done.
   ...
$ cd solc-lsp
$ npm install
```

# Testing

```console
$ npm test
```

This code runs `solc`. Specific versions of the Solidity compiler are downloaded when it is detected they are needed.

# Thanks

A big thanks to my employer, ConsenSys, for giving me the opportunity to work on this and providing the funding for this project.
