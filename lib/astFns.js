// Store a list of declarations by index key.
const remixAST = require("../node_modules/remix-astwalker/dist");

function indexNodes(finfo) {
  const id2node = {};
  const astWalker = new remixAST.AstWalker();
  const callback = function(node) {
     id2node[node.id] = node;
  }
  astWalker.walkFull(finfo.ast, callback);
  finfo.id2node = id2node;
}

function getTypeDefinition(finfo, selection) {
  const node =  finfo.sourceMapping.findNodeAtSourceLocation(null, selection, finfo.ast);
  if (node && ('typeDescriptions' in node)) {
    return node;
  }
  return null;
}

function getDefinition(finfo, selection) {
  const node =  finfo.sourceMapping.findNodeAtSourceLocation(null, selection, finfo.ast);
  if (node && "referencedDeclaration" in node) {
    if (!('id2node' in finfo)) indexNodes(finfo);
    return finfo.id2node[node.referencedDeclaration];
  }
  return null;
}

module.exports.getTypeDefinition = getTypeDefinition;
module.exports.getDefinition = getDefinition;
module.exports.indexNodes = indexNodes;;
