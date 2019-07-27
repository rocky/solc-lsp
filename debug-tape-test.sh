#!/bin/bash
# This is how you can debug a tape test.
# To just run a tape test use:
#   ts-node <test-name>
node --inspect ts-node $@
