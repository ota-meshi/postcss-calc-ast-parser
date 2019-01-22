import {
    MathExpression,
    Expression,
    Other,
    FunctionNode,
    LengthUnit,
    AngleUnit,
    TimeUnit,
    FrequencyUnit,
    ResolutionUnit,
    FlexUnit,
} from "../types/ast"
import { isCalc } from "./util/calc-notation"
import { getFunctionArguments } from "./util/utils"

type CalculateValue =
    | {
          value: number
          type: "Number"
      }
    | {
          value: number
          unit: LengthUnit
          type: "Length"
      }
    | {
          value: number
          unit: AngleUnit
          type: "Angle"
      }
    | {
          value: number
          unit: TimeUnit
          type: "Time"
      }
    | {
          value: number
          unit: FrequencyUnit
          type: "Frequency"
      }
    | {
          value: number
          unit: ResolutionUnit
          type: "Resolution"
      }
    | {
          value: number
          unit: "%"
          type: "Percentage"
      }
    | {
          value: number
          unit: FlexUnit
          type: "Flex"
      }
/**
 * Reduce the given expression.
 */
export function reduce(expr: MathExpression): CalculateValue | null {
    const left = getNum(expr.left)
    const right = getNum(expr.right)
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
export function reduceAddSub(
    left: CalculateValue,
    operator: "+" | "-",
    right: CalculateValue,
): CalculateValue | null {
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
export function reduceDivision(
    left: CalculateValue,
    right: CalculateValue,
): CalculateValue | null {
    if (right.type !== "Number") {
        return null
    }
    if (left.type === "Number") {
        return {
            type: "Number",
            value: left.value / right.value,
        }
    }
    return {
        type: left.type,
        value: left.value / right.value,
        unit: left.unit,
    } as CalculateValue
}

/**
 * Multiply the given expression.
 */
export function reduceMultiple(
    left: CalculateValue,
    right: CalculateValue,
): CalculateValue | null {
    if (left.type === "Number") {
        if (right.type === "Number") {
            return {
                type: "Number",
                value: left.value * right.value,
            }
        }
        return {
            type: right.type,
            value: left.value * right.value,
            unit: right.unit,
        } as CalculateValue
    } else if (right.type === "Number") {
        return {
            type: left.type,
            value: left.value * right.value,
            unit: left.unit,
        } as CalculateValue
    }
    return null
}

/**
 * Get number (with unit) the given expression.
 */
function getNum(expr: Expression | Other): CalculateValue | null {
    if (expr.type === "MathExpression") {
        return reduce(expr)
    }
    if (expr.type === "Parentheses") {
        if (expr.nodes.length === 1) {
            return getNum(expr.nodes[0])
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
function getCalcNumber(fn: FunctionNode): CalculateValue | null {
    const args = getFunctionArguments(fn)
    if (args && args.length === 1) {
        return getNum(args[0])
    }
    return null
}
