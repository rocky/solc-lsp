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
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addEventDeclaration(staticInfo: StaticInfo, node: SolcAstNode) {
    staticInfo[node.nodeType].push(node);
    staticInfo.tempInfo.functionName = node.name;
}

export function register(): NodeTypeCallbackFn {
    return {fn: addEventDeclaration} ;
}
