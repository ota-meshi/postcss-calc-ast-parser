import * as AST from "../../types/ast"

/**
 * checks whether the given node is comma.
 */
export function isComma(node: AST.Expression | AST.Other): boolean {
    return node.type === "Punctuator" && node.value === ","
}

/**
 * Get the function arguments from the given function node
 */
export function getFunctionArguments(
    fn: AST.FunctionNode,
): (AST.Expression | AST.Other)[] | null {
    const { nodes } = fn
    const first = nodes[0]
    if (!first || isComma(first)) {
        return null
    }
    const result = [first]
    const length = nodes.length
    for (let index = 1; index < length; index++) {
        const comma = nodes[index++]
        if (!isComma(comma)) {
            return null
        }
        const arg = nodes[index]
        if (!arg || isComma(arg)) {
            return null
        }
        result.push(arg)
    }
    return result
}
