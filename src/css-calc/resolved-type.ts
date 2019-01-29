import * as AST from "../types/ast"
import { isCalc, isMin, isMax, isClamp } from "./util/calc-notation"
import { getFunctionArguments } from "./util/utils"

type ResolvedType =
    | AST.NumberValue["type"]
    | AST.LengthValue["type"]
    | AST.AngleValue["type"]
    | AST.TimeValue["type"]
    | AST.FrequencyValue["type"]
    | AST.ResolutionValue["type"]
    | AST.PercentageValue["type"]
    | AST.FlexValue["type"]
    | "Unknown"

/* eslint-disable complexity */
/**
 * Get the resolved type of a given math expression.
 * @see https://www.w3.org/TR/css3-values/#calc-type-checking
 */
export function getResolvedType(
    expr: AST.MathExpression,
): ResolvedType | "invalid" {
    const left = getType(expr.left)
    const right = getType(expr.right)
    const { operator } = expr

    switch (operator) {
        case "+":
        case "-":
            if (left === "Unknown" || right === "Unknown") {
                return "Unknown"
            }
            if (left === right) {
                return left
            }
            if (left === "Number" || right === "Number") {
                return "invalid"
            }
            if (left === "Percentage") {
                return right
            }
            if (right === "Percentage") {
                return left
            }
            return "invalid"
        case "*":
            if (left === "Unknown" || right === "Unknown") {
                return "Unknown"
            }
            if (left === "Number") {
                return right
            }
            if (right === "Number") {
                return left
            }
            return "invalid"
        case "/":
            if (right === "Unknown") {
                return "Unknown"
            }
            if (right === "Number") {
                return left
            }
            return "invalid"
        default:
    }

    return "Unknown"
}
/* eslint-enable complexity */

/**
 * Get the type of the given expression type.
 */
function getExpressionType(expr: AST.Expression | AST.Other): ResolvedType {
    const { type } = expr
    if (
        type === "Number" ||
        type === "Length" ||
        type === "Angle" ||
        type === "Time" ||
        type === "Frequency" ||
        type === "Resolution" ||
        type === "Percentage" ||
        type === "Flex"
    ) {
        return type
    }
    return "Unknown"
}

/**
 * Get the type of a given expression.
 */
function getType(expr: AST.Expression | AST.Other): ResolvedType {
    if (expr.type === "MathExpression") {
        const rtype = getResolvedType(expr)
        return rtype === "invalid" ? "Unknown" : rtype
    }
    if (expr.type === "Parentheses") {
        if (expr.nodes.length === 1) {
            return getType(expr.nodes[0])
        }
        return "Unknown"
    }
    if (expr.type === "Function") {
        if (isCalc(expr.name)) {
            return getCalcFunctionType(expr)
        }
        // https://www.w3.org/TR/css-values-4/#calc-notation
        if (isMin(expr.name) || isMax(expr.name)) {
            return getMinMaxFunctionType(expr)
        }
        if (isClamp(expr.name)) {
            return getClampFunctionType(expr)
        }
        return "Unknown"
    }
    return getExpressionType(expr)
}

/**
 * Get the type of the given `calc()` function.
 */
function getCalcFunctionType(fn: AST.FunctionNode): ResolvedType {
    if (fn.nodes.length === 1) {
        return getFunctionArgumentsType(fn)
    }
    return "Unknown"
}

/**
 * Get the type of the given `min()` or `max()` function.
 */
function getMinMaxFunctionType(fn: AST.FunctionNode): ResolvedType {
    return getFunctionArgumentsType(fn)
}

/**
 * Get the type of the given `clamp()` function.
 */
function getClampFunctionType(fn: AST.FunctionNode): ResolvedType {
    if (fn.nodes.length === 5) {
        return getFunctionArgumentsType(fn)
    }
    return "Unknown"
}

/**
 * Get the type of the given function arguments.
 */
function getFunctionArgumentsType(fn: AST.FunctionNode): ResolvedType {
    const args = getFunctionArguments(fn)
    if (!args) {
        return "Unknown"
    }
    const types = args.map(getType)
    let result: ResolvedType | null = null
    for (const type of types) {
        if (!result || result === "Percentage") {
            result = type
        } else if (type === "Percentage") {
            // noop
        } else if (result !== type) {
            return "Unknown"
        }
    }
    return result || "Unknown"
}
