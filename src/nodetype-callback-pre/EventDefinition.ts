/* Copyright 2919 Rocky Bernstein

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, Signature, StaticInfo } from "../gather-info";

function addEventDefinition(staticInfo: StaticInfo, node: SolcAstNode) {
    // Set up to note that we are in this contract.
    staticInfo.tempInfo.functionName = node.name;
    const contractFnName = `${staticInfo.tempInfo.contractName}.${node.name}`;
    const signature: Signature = {params: [], returns: []};
    for (const param of node.parameters.parameters) {
	signature.params.push({paramName: param.name, paramType: param.typeName.name});
    }
    staticInfo.events[contractFnName] = signature;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addEventDefinition} ;
}
