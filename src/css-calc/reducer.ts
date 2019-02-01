import * as AST from "../types/ast"
import { isCalc } from "./util/calc-notation"
import { getFunctionArguments } from "./util/utils"

type ReduceValue =
    | {
          value: number
          type: AST.NumberValue["type"]
      }
    | {
          value: number
          unit: AST.LengthUnit
          type: AST.LengthValue["type"]
      }
    | {
          value: number
          unit: AST.AngleUnit
          type: AST.AngleValue["type"]
      }
    | {
          value: number
          unit: AST.TimeUnit
          type: AST.TimeValue["type"]
      }
    | {
          value: number
          unit: AST.FrequencyUnit
          type: AST.FrequencyValue["type"]
      }
    | {
          value: number
          unit: AST.ResolutionUnit
          type: AST.ResolutionValue["type"]
      }
    | {
          value: number
          unit: "%"
          type: AST.PercentageValue["type"]
      }
    | {
          value: number
          unit: AST.FlexUnit
          type: AST.FlexValue["type"]
      }

/**
 * Reduce the given expression.
 */
export function reduce(expr: AST.Node): ReduceValue | null {
    return reduceExpression(expr)
}

/**
 * Reduce the given math expression.
 */
function reduceMathExpression(expr: AST.MathExpression): ReduceValue | null {
    const left = reduceExpression(expr.left)
    const right = reduceExpression(expr.right)
    if (!left || !right) {
        return null
    }
    switch (expr.operator) {
        case "+":
        case "-":
            return reduceAddSub(left, expr.operator, right)
        case "/":
            return reduceDivision(left, right)
        case "*":
            return reduceMultiple(left, right)
        default:
    }
    return null
}

/**
 * Adds or subtracts the given expression.
 */
function reduceAddSub(
    left: ReduceValue,
    operator: "+" | "-",
    right: ReduceValue,
): ReduceValue | null {
    if (left.type !== right.type) {
        return null
    }
    const ope =
        operator === "-"
            ? (ln: number, rn: number) => ln - rn
            : (ln: number, rn: number) => ln + rn
    if (left.type === "Number") {
        return {
            type: "Number",
            value: ope(left.value, right.value),
        }
    }
    const lunit = left.unit
    const runit = (right as any).unit as string
    if (lunit === runit) {
        return {
            type: left.type as any,
            value: ope(left.value, right.value),
            unit: left.unit as any,
        }
    }
    return null
}

/**
 * Divides the given expression.
 */
function reduceDivision(
    left: ReduceValue,
    right: ReduceValue,
): ReduceValue | null {
    if (right.type !== "Number") {
        return null
    }
    if (left.type === "Number") {
        return {
            type: "Number",
            value: left.value / right.value,
        }
    }
    return ({
        type: left.type,
        value: left.value / right.value,
        unit: left.unit,
    } as any) as ReduceValue
}

/**
 * Multiply the given expression.
 */
function reduceMultiple(
    left: ReduceValue,
    right: ReduceValue,
): ReduceValue | null {
    if (left.type === "Number") {
        if (right.type === "Number") {
            return {
                type: "Number",
                value: left.value * right.value,
            }
        }
        return ({
            type: right.type,
            value: left.value * right.value,
            unit: right.unit,
        } as any) as ReduceValue
    } else if (right.type === "Number") {
        return ({
            type: left.type,
            value: left.value * right.value,
            unit: left.unit,
        } as any) as ReduceValue
    }
    return null
}

/**
 * Get number (with unit) the given expression.
 */
function reduceExpression(expr: AST.Node): ReduceValue | null {
    if (
        expr.type === "Number" ||
        expr.type === "Length" ||
        expr.type === "Angle" ||
        expr.type === "Time" ||
        expr.type === "Frequency" ||
        expr.type === "Resolution" ||
        expr.type === "Percentage" ||
        expr.type === "Flex"
    ) {
        return expr
    }
    if (expr.type === "MathExpression") {
        return reduceMathExpression(expr)
    }
    if (expr.type === "Parentheses" || expr.type === "Root") {
        if (expr.nodes.length === 1) {
            return reduceExpression(expr.nodes[0])
        }
    } else if (expr.type === "Function") {
        if (expr.type === "Function") {
            if (isCalc(expr.name)) {
                return getCalcNumber(expr)
            }
            // TODO https://www.w3.org/TR/css-values-4/#calc-notation
        }
    }
    return null
}

/**
 * Get the number (with unit) of the given `calc()` function.
 */
function getCalcNumber(fn: AST.FunctionNode): ReduceValue | null {
    const args = getFunctionArguments(fn)
    if (args && args.length === 1) {
        return reduceExpression(args[0])
    }
    return null
}
