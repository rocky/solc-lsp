#!/bin/sh
# Things done after an "npm install"

# VSCode barfs silently if C bindings are used and this package migth
# be imported in VSCode.  Therefore, we move that out of the way, and
# the Pure JS code is used instead.

# Not needed anymore?
if ((0)); then
    BINDINGS_FILE=node_modules/keccak/bindings.js
    if [ -f $BINDINGS_FILE ] ; then
	mv $BINDINGS_FILE ${BINDINGS_FILE}-save
    fi
fi


# If you get a version node version mismatch "XXX was build with NODE_VERSION 69,
# this version requires NODE_VERSION 64" or some such bullshit, it is due to usiing scrypt.js. scrypt-js works.
(cd node_modules && patch -p1 < ../solc-lsp-fix.diff)
