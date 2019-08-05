import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addStructDefinition(staticInfo: StaticInfo, node: SolcAstNode) {
    staticInfo.structs[node.name] = node.members.map(m => m.name);
}

export function register(): NodeTypeCallbackFn {
    return {fn: addStructDefinition} ;
}
