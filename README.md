Language Server Functions
-------------------------

Here we implement "Language Server" functions for Solidity using solc.
The functions are the underlying workhorse function that would be used to implement the Microsoft Language Server Protocol Specification which you is defined [here](https://microsoft.github.io/language-server-protocol/specification).


# Prerequisites...

You need to have installed

* [nodejs](https://nodejs.org/en/). Currently node version 12 cannot be used to build a dependent package `scrypt`, so use an earlier version. See below for details
* [npm](https://www.npmjs.com/get-npm)

There are a number of nodejs packages are needed, like [typescript](https://www.typescriptlang.org/), but you can get those via `npm`,
which is described in a below [section](#how-to-run-code-in-this-github-repository).

# How to run code in this github repository

Clone the repository.

```console
$ git clone https://github.com/rocky/solc-lsp.git
Cloning into 'solc-lsp
remote: Enumerating objects: 169, done.
...
$ cd solc-lsp
$ make
```

Install dependent npm packages:

```console
$ make
```

This code runs `solc`, and untimately that pulls in the `scrypt` package. Nodejs version 12 doesn't work with this. See https://github.com/barrysteyn/node-scrypt/issues/193\. So use an earlier version of nodejs.

I also needed to replace uses of `script.js` with `script-js` and that is currently in the `web3-eth-accounts` package.
