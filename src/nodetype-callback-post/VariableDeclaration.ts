import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addVariableDecl(staticInfo: StaticInfo, node: SolcAstNode) {
    // Nothing to do here yet.
    const t = staticInfo.tempInfo;
    const contractFnVarName = `${t.contractName}.${t.functionName}.${node.name}`;
    staticInfo.vars[contractFnVarName] = node.typeDescriptions.typeString;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addVariableDecl} ;
}
