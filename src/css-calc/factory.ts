/* eslint-disable @mysticatea/ts/no-var-requires */
// @ts-ignore
const valueParserUnit = require("postcss-value-parser/lib/unit")
/* eslint-enable @mysticatea/ts/no-var-requires */

import * as AST from "../types/ast"
import * as Impl from "./util/node-impl"

const LENGTH_UNITS: AST.LengthUnit[] = [
    "em",
    "ex",
    "ch",
    "rem",
    "vw",
    "vh",
    "vmin",
    "vmax",
    "px",
    "mm",
    "cm",
    "in",
    "pt",
    "pc",
    "Q",
    "vm",
]
const ANGLE_UNITS: AST.AngleUnit[] = ["deg", "grad", "turn", "rad"]
const TIME_UNITS: AST.TimeUnit[] = ["s", "ms"]
const FREQUENCY_UNITS: AST.FrequencyUnit[] = ["Hz", "kHz"]
const RESOLUTION_UNITS: AST.ResolutionUnit[] = ["dpi", "dpcm", "dppm"]
const FLEX_UNITS: AST.FlexUnit[] = ["fr"]

const L_LENGTH_UNITS = LENGTH_UNITS.map(u => u.toLowerCase())
const L_ANGLE_UNITS = ANGLE_UNITS.map(u => u.toLowerCase())
const L_TIME_UNITS = TIME_UNITS.map(u => u.toLowerCase())
const L_FREQUENCY_UNITS = FREQUENCY_UNITS.map(u => u.toLowerCase())
const L_RESOLUTION_UNITS = RESOLUTION_UNITS.map(u => u.toLowerCase())
const L_FLEX_UNITS = FLEX_UNITS.map(u => u.toLowerCase())

/**
 * Create node
 * @returns punctuator node
 */
export function newPunctuator(
    token: AST.PunctuatorToken,
    before: string,
): AST.Punctuator {
    return newTokenNode(
        Impl.Punctuator,
        token,
        token.value as "," | ")",
        before,
    )
}
/**
 * Create node
 * @returns operator node
 */
export function newOperator(
    token: AST.OperatorToken,
    before: string,
): AST.Operator {
    return newTokenNode(Impl.Operator, token, token.value, before)
}
/**
 * Create node
 * @returns string node
 */
export function newString(
    token: AST.StringToken,
    before: string,
): AST.StringNode {
    return newTokenNode(Impl.StringNode, token, token.value, before)
}
/**
 * Create node
 * @returns word node, number node or number with unit node
 */
export function newWordNode(
    token: AST.WordToken,
    before: string,
):
    | AST.NumberValue
    | AST.LengthValue
    | AST.AngleValue
    | AST.TimeValue
    | AST.FrequencyValue
    | AST.ResolutionValue
    | AST.PercentageValue
    | AST.FlexValue
    | AST.Word {
    return newValueNode(token, before)
}

/**
 * Create function node
 * @returns function node
 */
export function newFunction(
    token: AST.WordToken,
    before: string,
    open: AST.PunctuatorToken,
): AST.FunctionNode {
    return new Impl.FunctionNode(token.value, before, {
        start: token.source.start,
        end: open.source.end,
    })
}

/**
 * Create parentheses node
 * @returns parentheses node
 */
export function newParentheses(
    token: AST.PunctuatorToken,
    before: string,
): AST.Parentheses {
    return new Impl.Parentheses(before, {
        start: token.source.start,
        end: token.source.end,
    })
}

/**
 * Create math expression node
 * @returns math expression node
 */
export function newMathExpression(
    left: AST.Expression,
    op: "+" | "-" | "*" | "/",
    right: AST.Expression,
): AST.MathExpression
/**
 * Create math expression node
 * @returns math expression node
 */
export function newMathExpression(
    left: AST.Expression,
    op: AST.Operator,
    right: AST.Expression,
): AST.MathExpression
/**
 * Create math expression node
 * @returns math expression node
 */
export function newMathExpression(
    left: AST.Expression,
    op: "+" | "-" | "*" | "/" | AST.Operator,
    right: AST.Expression,
): AST.MathExpression {
    const opNode =
        typeof op === "string"
            ? newTokenNode(
                  Impl.Operator,
                  { source: { start: { index: 0 }, end: { index: 0 } } },
                  op,
                  " ",
              )
            : op

    const { before } = left.raws
    left.raws.before = ""
    return new Impl.MathExpression(left, opNode, right, before, {
        start: left.source.start,
        operator: opNode.source,
        end: right.source.end,
    })
}

/**
 * Create value node
 * @returns Value node
 */
function newValueNode(
    token: AST.WordToken | AST.StringToken,
    before: string,
):
    | AST.NumberValue
    | AST.LengthValue
    | AST.AngleValue
    | AST.TimeValue
    | AST.FrequencyValue
    | AST.ResolutionValue
    | AST.PercentageValue
    | AST.FlexValue
    | AST.Word {
    if (token.type === "word") {
        const parsedUnit = valueParserUnit(token.value) as
            | {
                  number: string
                  unit: string
              }
            | false
        if (parsedUnit) {
            const n = newNumNode(parsedUnit, token, before)
            if (n) {
                return n
            }
        }
    }

    return newTokenNode(Impl.Word, token, token.value, before)
}

/**
 * Create number node
 * @returns number node
 */
function newNumNode(
    parsedUnit: {
        number: string
        unit: string
    },
    token: AST.WordToken,
    before: string,
):
    | AST.NumberValue
    | AST.LengthValue
    | AST.AngleValue
    | AST.TimeValue
    | AST.FrequencyValue
    | AST.ResolutionValue
    | AST.PercentageValue
    | AST.FlexValue
    | null {
    const { source } = token
    if (!parsedUnit.unit) {
        return new Impl.NumberValue(parsedUnit.number, before, source)
    }

    const lunit = parsedUnit.unit.toLowerCase()

    /**
     * new number with unit node
     */
    function unitNode<
        T extends
            | AST.LengthValue
            | AST.AngleValue
            | AST.TimeValue
            | AST.FrequencyValue
            | AST.ResolutionValue
            | AST.FlexValue
            | AST.PercentageValue
    >(
        WithUnitValue: new (
            value: string,
            unit: T["unit"],
            before: string,
            source: AST.SourceLocation,
        ) => T,
        unit: T["unit"],
    ): T {
        const n = new WithUnitValue(parsedUnit.number, unit, before, source)
        if (unit !== parsedUnit.unit) {
            n.raws.unit = {
                raw: parsedUnit.unit,
                value: unit,
            }
        }
        return n
    }

    let unitIndex
    if ((unitIndex = L_LENGTH_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(Impl.LengthValue, LENGTH_UNITS[unitIndex])
    }
    if ((unitIndex = L_ANGLE_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(Impl.AngleValue, ANGLE_UNITS[unitIndex])
    }
    if ((unitIndex = L_TIME_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(Impl.TimeValue, TIME_UNITS[unitIndex])
    }
    if ((unitIndex = L_FREQUENCY_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(Impl.FrequencyValue, FREQUENCY_UNITS[unitIndex])
    }
    if ((unitIndex = L_RESOLUTION_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(Impl.ResolutionValue, RESOLUTION_UNITS[unitIndex])
    }
    if ((unitIndex = L_FLEX_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(Impl.FlexValue, FLEX_UNITS[unitIndex])
    }
    if (lunit === "%") {
        return unitNode(Impl.PercentageValue, "%")
    }
    return null
}

function newTokenNode(
    TokenValue: new (
        value: AST.Word["value"],
        before: string,
        source: AST.SourceLocation,
    ) => AST.Word,
    token: { source: AST.SourceLocation },
    value: AST.Word["value"],
    before: string,
): AST.Word

function newTokenNode(
    TokenValue: new (
        value: AST.Punctuator["value"],
        before: string,
        source: AST.SourceLocation,
    ) => AST.Punctuator,
    token: { source: AST.SourceLocation },
    value: AST.Punctuator["value"],
    before: string,
): AST.Punctuator

function newTokenNode(
    TokenValue: new (
        value: AST.Operator["value"],
        before: string,
        source: AST.SourceLocation,
    ) => AST.Operator,
    token: { source: AST.SourceLocation },
    value: AST.Operator["value"],
    before: string,
): AST.Operator

function newTokenNode(
    TokenValue: new (
        value: AST.StringNode["value"],
        before: string,
        source: AST.SourceLocation,
    ) => AST.StringNode,
    token: { source: AST.SourceLocation },
    value: AST.StringNode["value"],
    before: string,
): AST.StringNode

/**
 * Create a node that uses token as it is.
 * @returns node
 */
function newTokenNode<
    T extends AST.Word | AST.Punctuator | AST.Operator | AST.StringNode
>(
    TokenValue: new (
        value: T["value"],
        before: string,
        source: AST.SourceLocation,
    ) => T,
    token: { source: AST.SourceLocation },
    value: T["value"],
    before: string,
): T {
    const { source } = token
    return new TokenValue(value, before, source)
}
