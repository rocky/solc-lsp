import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addVariableDecl(staticInfo: StaticInfo, node: SolcAstNode) {
    staticInfo[node.nodeType].push(node);
    staticInfo.tempInfo.functionName = node.name;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addVariableDecl} ;
}
