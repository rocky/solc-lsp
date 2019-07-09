#!/bin/sh
# Things done after an "npm install"

# VSCode barfs silently if C bindings are used and this package migth
# be imported in VSCode.  Therefore, we move that out of the way, and
# the Pure JS code is used instead.
BINDINGS_FILE=node_modules/keccak/bindings.js
if [ -f $BINDINGS_FILE ] ; then
    mv $BINDINGS_FILE ${BINDINGS_FILE}-save
fi
