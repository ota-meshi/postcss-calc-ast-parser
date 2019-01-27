import { ParseError } from "./errors"
import { SourceLocation } from "./locations"
import { Token } from "./tokens"

export interface INode {
    type: string
    parent: IContainer | INode | null
    raws:
        | {
              before: string
          }
        | {
              after: string
          }
    source?: SourceLocation
    toString(): string
    walk(
        type: string | RegExp,
        callback: (node: any) => boolean | void,
    ): boolean | void
}

export interface IContainer extends INode {
    readonly nodes: INode[]
    readonly first: INode | null
    readonly last: INode | null
    removeAll(): this
    removeChild(child: INode): this
    push(child: INode): this
    append(...children: INode[]): this
    prepend(...children: INode[]): this
    insertBefore(exist: INode, add: INode): this
    insertAfter(exist: INode, add: INode): this
}

/**
 * Expression
 */
export type Expression =
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | Word
    | MathExpression
    | FunctionNode
    | Parentheses
    | StringNode

/**
 * Number value
 * @see https://www.w3.org/TR/css3-values/#integers
 * @see https://www.w3.org/TR/css3-values/#numbers
 */
export interface NumberValue extends INode {
    type: "Number"
    value: number
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
    }
}

/**
 * Length value
 * @see https://www.w3.org/TR/css3-values/#lengths
 */
export interface LengthValue extends INode {
    type: "Length"
    value: number
    unit: LengthUnit
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"em"`, `"ex"`, `"ch"`, `"rem"`, `"vw"`, `"vh"`, `"vmin"`, `"vmax"`,
         * `"px"`, `"mm"`, `"cm"`, `"in"`, `"pt"`, `"pc"`, `"Q"` or `"vm"` (non-standard name)
         */
        unit?: {
            raw: string
            value: string
        }
    }
}

export type LengthUnit =
    | "em"
    | "ex"
    | "ch"
    | "rem"
    | "vw"
    | "vh"
    | "vmin"
    | "vmax"
    | "px"
    | "mm"
    | "cm"
    | "in"
    | "pt"
    | "pc"
    | "Q"
    | "vm" // (non-standard name)

/**
 * Angle value
 * @see https://www.w3.org/TR/css3-values/#angles
 */
export interface AngleValue extends INode {
    type: "Angle"
    value: number
    unit: AngleUnit
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"deg"`, `"grad"`, `"turn"` or `"rad"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}

export type AngleUnit = "deg" | "grad" | "turn" | "rad"

/**
 * Time value
 * @see https://www.w3.org/TR/css3-values/#time
 */
export interface TimeValue extends INode {
    type: "Time"
    value: number
    unit: TimeUnit
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"s"` or `"ms"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}

export type TimeUnit = "s" | "ms"

/**
 * Frequency value
 * @see https://www.w3.org/TR/css3-values/#frequency
 */
export interface FrequencyValue extends INode {
    type: "Frequency"
    value: number
    unit: FrequencyUnit
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"Hz"` or `"kHz"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}

export type FrequencyUnit = "Hz" | "kHz"

/**
 * Resolution value
 * @see https://www.w3.org/TR/css3-values/#resolution
 */
export interface ResolutionValue extends INode {
    type: "Resolution"
    value: number
    unit: ResolutionUnit
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"dpi"`, `"dpcm"` or `"dppm"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}

export type ResolutionUnit = "dpi" | "dpcm" | "dppm"

/**
 * Percentage value
 * @see https://www.w3.org/TR/css3-values/#percentages
 */
export interface PercentageValue extends INode {
    type: "Percentage"
    value: number
    unit: "%"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        unit?: {
            raw: string
            value: string
        }
    }
}

/**
 * Flex value
 * @see https://www.w3.org/TR/css-grid-1/#fr-unit
 */
export interface FlexValue extends INode {
    type: "Flex"
    value: number
    unit: FlexUnit
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"fr"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
export type FlexUnit = "fr"

/**
 * Unknown value or word
 */
export interface Word extends INode {
    type: "Word"
    value: string
    raws: {
        before: string
    }
}

/**
 * Math expression
 */
export interface MathExpression extends INode {
    type: "MathExpression"
    left: Expression
    operator: "+" | "-" | "*" | "/"
    right: Expression
    raws: {
        before: string
        /**
         * the symbols between the left and operator.
         */
        between: string
    }
    source?: {
        operator: SourceLocation
    } & SourceLocation
}

/**
 * Function
 */
export interface FunctionNode extends IContainer {
    type: "Function"
    name: string
    nodes: (Expression | Other)[]
    raws: {
        before: string
        beforeClose?: string
    }
    unclosed?: boolean
}

/**
 * Parentheses
 */
export interface Parentheses extends IContainer {
    type: "Parentheses"
    nodes: (Expression | Other)[]
    raws: {
        before: string
        beforeClose?: string
    }
    unclosed?: boolean
}

/**
 * String
 */
export interface StringNode extends INode {
    type: "String"
    value: string
    raws: {
        before: string
    }
}

/**
 * Root
 */
export interface Root extends IContainer {
    type: "Root"
    nodes: (Expression | Other)[]
    tokens: Token[]
    errors: ParseError[]
    raws: { after: string }
}

export type Other = Operator | Punctuator

/**
 * Punctuator
 */
export interface Punctuator extends INode {
    type: "Punctuator"
    value: "," | "(" | ")"
    raws: {
        before: string
    }
}

/**
 * Operator
 */
export interface Operator extends INode {
    type: "Operator"
    value: "+" | "-" | "*" | "/"
    raws: {
        before: string
    }
}

export type Node = Expression | Other | Root
