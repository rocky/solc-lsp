"use strict";

// FIXME there has to be a better way.
// Maybe we'll convert everything to typescript.
const lspManager = require("./lib/lspManager");
const helper = require("./lib/helper");

module.exports.LspManager = lspManager.LspManager;
module.exports.rangeToLspPosition = helper.rangeToLspPosition;
module.exports.LspPositionToOffset = helper.LspPositionToOffset;
