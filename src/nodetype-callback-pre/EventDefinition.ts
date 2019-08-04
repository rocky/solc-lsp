import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, Signature, StaticInfo } from "../gather-info";

function addEventDefinition(staticInfo: StaticInfo, node: SolcAstNode) {
    // Set up to note that we are in this contract.
    staticInfo.tempInfo.functionName = node.name;
    const contractFnName = `${staticInfo.tempInfo.contractName}.${node.name}`;
    const signature: Signature = {params: []};
    for (const param of node.parameters.parameters) {
	signature.params.push({paramName: param.name, paramType: param.typeName.name});
    }
    staticInfo.events[contractFnName] = signature;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addEventDefinition} ;
}
