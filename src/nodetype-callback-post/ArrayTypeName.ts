import { SolcAstNode } from "../solc-ast/types";
import { NodeTypeCallbackFn, StaticInfo } from "../gather-info";

function addArrayDecl(staticInfo: StaticInfo, node: SolcAstNode) {
    const parent = node.parent;
    if (parent && parent.nodeType == "VariableDeclaration") {
	const parentName: string = parent.name;
	staticInfo.arrays.add(parentName);
    }
}

export function register(): NodeTypeCallbackFn {
    return {fn: addArrayDecl} ;
}
