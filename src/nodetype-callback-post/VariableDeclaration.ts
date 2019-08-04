import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addVariableDecl(staticInfo: StaticInfo, node: SolcAstNode) {
    // Nothing to do here yet.
    node; staticInfo;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addVariableDecl} ;
}
