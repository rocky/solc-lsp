import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addVariableDecl(staticInfo: StaticInfo, node: SolcAstNode) {
    staticInfo.enums[node.name] = node.members.map(m => m.name);
}

export function register(): NodeTypeCallbackFn {
    return {fn: addVariableDecl} ;
}