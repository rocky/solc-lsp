import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, Signature, StaticInfo } from "../gather-info";

function addFunctionDefinition(staticInfo: StaticInfo, node: SolcAstNode) {
    // Set up to note that we are in this contract.
    staticInfo.tempInfo.functionName = node.name;
    const contractFnName = `${staticInfo.tempInfo.contractName}.${node.name}`;
    const signature: Signature = {params: [], returns: []};
    for (const param of node.parameters.parameters) {
	signature.params.push({paramName: param.name, paramType: param.typeName.name});
    }
    for (const r of node.returnParameters.parameters) {
	signature.returns.push({paramName: r.name, paramType: r.typeName.name});
    }
    staticInfo.fns[contractFnName] = signature;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addFunctionDefinition} ;
}
