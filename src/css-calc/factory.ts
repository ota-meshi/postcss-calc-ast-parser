/* eslint-disable @mysticatea/ts/no-var-requires */
// @ts-ignore
const valueParserUnit = require("postcss-value-parser/lib/unit")
/* eslint-enable @mysticatea/ts/no-var-requires */

import { QUOTATION_MARK, APOSTROPHE } from "./util/unicode"
import {
    WordToken,
    StringToken,
    NumberValue,
    LengthValue,
    AngleValue,
    TimeValue,
    FrequencyValue,
    ResolutionValue,
    PercentageValue,
    FlexValue,
    Word,
    SourceLocation,
    LengthUnit,
    AngleUnit,
    TimeUnit,
    FrequencyUnit,
    ResolutionUnit,
    FlexUnit,
    Punctuator,
    Operator,
    PunctuatorToken,
    OperatorToken,
    FunctionNode,
    Parentheses,
    MathExpression,
    Expression,
    INode,
    StringNode,
} from "../types/ast"
import {
    NumberValueImpl,
    LengthValueImpl,
    AngleValueImpl,
    TimeValueImpl,
    FrequencyValueImpl,
    ResolutionValueImpl,
    FlexValueImpl,
    PercentageValueImpl,
    WordImpl,
    PunctuatorImpl,
    OperatorImpl,
    FunctionNodeImpl,
    ParenthesesImpl,
    MathExpressionImpl,
    StringNodeImpl,
} from "./util/nodes"

const LENGTH_UNITS: LengthUnit[] = [
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
const ANGLE_UNITS: AngleUnit[] = ["deg", "grad", "turn", "rad"]
const TIME_UNITS: TimeUnit[] = ["s", "ms"]
const FREQUENCY_UNITS: FrequencyUnit[] = ["Hz", "kHz"]
const RESOLUTION_UNITS: ResolutionUnit[] = ["dpi", "dpcm", "dppm"]
const FLEX_UNITS: FlexUnit[] = ["fr"]

const L_LENGTH_UNITS = LENGTH_UNITS.map(u => u.toLowerCase())
const L_ANGLE_UNITS = ANGLE_UNITS.map(u => u.toLowerCase())
const L_TIME_UNITS = TIME_UNITS.map(u => u.toLowerCase())
const L_FREQUENCY_UNITS = FREQUENCY_UNITS.map(u => u.toLowerCase())
const L_RESOLUTION_UNITS = RESOLUTION_UNITS.map(u => u.toLowerCase())
const L_FLEX_UNITS = FLEX_UNITS.map(u => u.toLowerCase())

/**
 * checks whether the given node is expression.
 */
function isString(text: string): boolean {
    const c = text.charCodeAt(0)
    return (
        (c === QUOTATION_MARK || c === APOSTROPHE) &&
        c === text.charCodeAt(text.length - 1)
    )
}

/**
 * Create location
 */
function initLoc() {
    return { start: { index: 0 }, end: { index: 0 } }
}

/**
 * Get the location from given node
 */
function srcLoc(node: INode): SourceLocation {
    return node.source || initLoc()
}

/*eslint-disable no-param-reassign */
/**
 * Create node
 * @returns word node, number node or number with unit node
 */
export function newNode(
    text: string,
):
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | Word
    | Punctuator
    | Operator
/**
 * Create node
 * @returns word node, number node or number with unit node
 */
export function newNode(
    token: WordToken,
    before: string,
):
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | Word
/**
 * Create node
 * @returns punctuator node
 */
export function newNode(token: PunctuatorToken, before: string): Punctuator
/**
 * Create node
 * @returns operator node
 */
export function newNode(token: OperatorToken, before: string): Operator
/**
 * Create node
 * @returns string node
 */
export function newNode(token: StringToken, before: string): StringNode
/**
 * Create node
 * @returns word node, number node or number with unit node
 */
export function newNode(
    arg: string | WordToken | PunctuatorToken | OperatorToken | StringToken,
    before?: string,
):
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | Word
    | Punctuator
    | Operator
    | StringNode {
    let token: WordToken | StringToken | PunctuatorToken | OperatorToken
    if (typeof arg === "string" || typeof arg === "number") {
        const text = `${arg}`
        token = strToToken(text)

        const r = /^\s+/u.exec(text)
        before = r ? r[0] : ""
    } else {
        token = arg
    }
    if (token.type === "word") {
        return newValueNode(token, before)
    } else if (token.type === "string") {
        return newTokenNode(StringNodeImpl, token, before)
    } else if (token.type === "punctuator") {
        return newTokenNode(PunctuatorImpl, token, before)
    } else if (token.type === "operator") {
        return newTokenNode(OperatorImpl, token, before)
    }
    throw new Error("illegal token")
}

/**
 * Create function node
 * @returns function node
 */
export function newFunctionNode(name: string): FunctionNode
/**
 * Create function node
 * @returns function node
 */
export function newFunctionNode(
    token: WordToken,
    before: string,
    open: PunctuatorToken,
): FunctionNode
/**
 * Create function node
 * @returns function node
 */
export function newFunctionNode(
    arg: WordToken | string,
    before?: string,
    open?: PunctuatorToken,
): FunctionNode {
    let token: WordToken
    if (typeof arg === "string") {
        const text = `${arg}`
        token = {
            type: "word",
            value: text.trim(),
            source: initLoc(),
        }

        const r = /^\s+/u.exec(text)
        before = r ? r[0] : ""
    } else {
        token = arg
    }
    if (!open) {
        open = {
            type: "punctuator",
            value: "(",
            source: initLoc(),
        }
    }
    return new FunctionNodeImpl(token.value, before, {
        start: token.source.start,
        end: open.source.end,
    })
}

/**
 * Create parentheses node
 * @returns parentheses node
 */
export function newParenthesesNode(): Parentheses
/**
 * Create parentheses node
 * @returns parentheses node
 */
export function newParenthesesNode(
    token: PunctuatorToken,
    before: string,
): Parentheses
/**
 * Create parentheses node
 * @returns parentheses node
 */
export function newParenthesesNode(
    token?: PunctuatorToken,
    before?: string,
): Parentheses {
    const source =
        (token && {
            start: token.source.start,
            end: token.source.end,
        }) ||
        initLoc()
    return new ParenthesesImpl(before, source)
}

/**
 * Create math expression node
 * @returns math expression node
 */
export function newMathExpressionNode(
    left: string,
    op: string,
    right: string,
): MathExpression
/**
 * Create math expression node
 * @returns math expression node
 */
export function newMathExpressionNode(
    left: Expression,
    op: Operator,
    right: Expression,
): MathExpression
/**
 * Create math expression node
 * @returns math expression node
 */
export function newMathExpressionNode(
    left: string | Expression,
    op: string | Operator,
    right: string | Expression,
): MathExpression {
    const leftExpr = toExpression(left)
    const opNode = toOperator(op)
    const rightExpr = toExpression(right)
    const { before } = leftExpr.raws
    leftExpr.raws.before = ""
    return new MathExpressionImpl(leftExpr, opNode, rightExpr, before, {
        start: srcLoc(leftExpr).start,
        operator: srcLoc(opNode),
        end: srcLoc(rightExpr).end,
    })
}

/**
 * string to token
 */
function strToToken(
    text: string,
): WordToken | StringToken | PunctuatorToken | OperatorToken {
    text = text.trim()
    if (isString(text)) {
        return {
            type: "string",
            value: text,
            source: initLoc(),
        }
    }
    if (text === "," || text === "(" || text === ")") {
        return {
            type: "punctuator",
            value: text,
            source: initLoc(),
        }
    }
    if (text === "+" || text === "-" || text === "*" || text === "/") {
        return {
            type: "operator",
            value: text,
            source: initLoc(),
        }
    }
    return {
        type: "word",
        value: text,
        source: initLoc(),
    }
}
/*eslint-enable no-param-reassign */

/**
 * string to expression
 */
function toExpression(expr: string | Expression): Expression {
    if (typeof expr === "string" || typeof expr === "number") {
        const node = newNode(expr)
        if (node.type === "Operator" || node.type === "Punctuator") {
            throw new Error(`illegal text "${expr}"`)
        }
        return node
    }

    return expr
}

/**
 * string to operator
 */
function toOperator(op: string | Operator): Operator {
    if (typeof op === "string" || typeof op === "number") {
        const node = newNode(op)
        if (node.type !== "Operator") {
            throw new Error(`illegal text "${op}"`)
        }
        return node
    }

    return op
}

/**
 * Create value node
 * @returns Value node
 */
function newValueNode(
    token: WordToken | StringToken,
    before?: string,
):
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | Word {
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

    return newTokenNode(WordImpl, token, before)
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
    token: WordToken,
    before?: string,
):
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | null {
    const { source } = token
    if (!parsedUnit.unit) {
        return new NumberValueImpl(parsedUnit.number, before, source)
    }

    const lunit = parsedUnit.unit.toLowerCase()

    /**
     * new number with unit node
     */
    function unitNode<
        T extends
            | LengthValueImpl
            | AngleValueImpl
            | TimeValueImpl
            | FrequencyValueImpl
            | ResolutionValueImpl
            | FlexValueImpl
            | PercentageValueImpl
    >(
        WithUnitValue: new (
            value: string,
            unit: T["unit"],
            before?: string,
            source?: SourceLocation,
        ) => T,
        unit: T["unit"],
    ): T {
        const n = new WithUnitValue(parsedUnit.number, unit, before, source)
        if (unit !== parsedUnit.unit) {
            n.raws.unit = {
                raw: parsedUnit.unit,
                value: unit,
            } as any
        }
        return n
    }

    let unitIndex
    if ((unitIndex = L_LENGTH_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(LengthValueImpl, LENGTH_UNITS[unitIndex])
    }
    if ((unitIndex = L_ANGLE_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(AngleValueImpl, ANGLE_UNITS[unitIndex])
    }
    if ((unitIndex = L_TIME_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(TimeValueImpl, TIME_UNITS[unitIndex])
    }
    if ((unitIndex = L_FREQUENCY_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(FrequencyValueImpl, FREQUENCY_UNITS[unitIndex])
    }
    if ((unitIndex = L_RESOLUTION_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(ResolutionValueImpl, RESOLUTION_UNITS[unitIndex])
    }
    if ((unitIndex = L_FLEX_UNITS.indexOf(lunit)) >= 0) {
        return unitNode(FlexValueImpl, FLEX_UNITS[unitIndex])
    }
    if (lunit === "%") {
        return unitNode(PercentageValueImpl, "%")
    }
    return null
}

/**
 * Create a node that uses token as it is.
 * @returns node
 */
function newTokenNode<T extends Word | Punctuator | Operator | StringNode>(
    TokenValue: new (
        value: T["value"],
        before?: string,
        source?: SourceLocation,
    ) => T,
    token: { source: SourceLocation; value: T["value"] },
    before?: string,
): T {
    const { source } = token
    return new TokenValue(token.value, before, source)
}
