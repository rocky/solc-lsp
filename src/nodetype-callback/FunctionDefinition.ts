import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addVariableDecl(staticInfo: StaticInfo, node: SolcAstNode) {
    // Set up to note that we are in this contract.
    staticInfo.tempInfo.functionName = node.name;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addVariableDecl} ;
}
