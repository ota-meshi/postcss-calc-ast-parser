import {
    INode,
    IContainer,
    FunctionNode,
    SourceLocation,
    IToken,
    Expression,
    Parentheses,
    NumberValue,
    LengthValue,
    LengthUnit,
    AngleValue,
    AngleUnit,
    TimeValue,
    TimeUnit,
    FrequencyUnit,
    FrequencyValue,
    ResolutionUnit,
    ResolutionValue,
    PercentageValue,
    FlexUnit,
    FlexValue,
    Word,
    Punctuator,
    Operator,
    MathExpression,
    Root,
    Token,
    ParseError,
    StringNode,
} from "../../types/ast"

import { Stringifier } from "../stringifier"
type Stringify = (
    node:
        | INode // nodes
        | IToken, // tokens
) => string
let defaultStringifier: Stringifier | null = null

/**
 * Node core API
 */
export abstract class AbsNode implements INode {
    public abstract type: string
    public abstract raws:
        | {
              before: string
          }
        | {
              after: string
          }
    public parent: IContainer | null = null
    /**
     * Returns a CSS string representing the node.
     *
     * @returns CSS string of this node.
     */
    public toString(stringifier?: Stringifier | Stringify): string {
        if (typeof stringifier === "function") {
            return (stringifier as Stringify)(this)
        }
        return (
            stringifier ||
            defaultStringifier ||
            (defaultStringifier = new Stringifier())
        ).stringify(this)
    }

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each node.
     */
    public walk(
        type: string | RegExp,
        callback: (node: any) => boolean | void,
    ): boolean | void {
        const node = this as any
        let result = undefined
        const nodes = [...(node.nodes || []), node.left, node.right].filter(n =>
            Boolean(n),
        )
        const check =
            typeof type === "string"
                ? (n: any) => n.type === type
                : (n: any) => type.test(n.type)
        for (const child of nodes) {
            if (check(child)) {
                result = callback(child)
                if (result === false) {
                    break
                }
            }
            if (child.walk) {
                result = child.walk(type, callback)
                if (result === false) {
                    break
                }
            }
        }
        return result
    }
}

/**
 * The container nodes
 * inherit some common methods to help work with their children.
 */
export abstract class AbsContainer extends AbsNode implements IContainer {
    public abstract nodes: INode[]

    /**
     * Push Node
     */
    public push(child: INode): this {
        child.parent = this
        this.nodes.push(child)
        return this
    }
    /**
     * Unshift Node
     */
    public unshift(child: INode): this {
        child.parent = this
        this.nodes.unshift(child)
        return this
    }

    /**
     * Inserts new nodes to the end of the container.
     */
    public append(...children: INode[]): this {
        for (const child of children) {
            this.push(child)
        }
        return this
    }

    /**
     * Inserts new nodes to the start of the container.
     */
    public prepend(...children: INode[]): this {
        for (const child of children.reverse()) {
            this.unshift(child)
        }
        return this
    }

    /**
     * Insert new node before old node within the container.
     */
    public insertBefore(exist: INode, add: INode): this {
        const existIndex = this.nodes.indexOf(exist)
        if (existIndex < 0) {
            throw new Error("The given node could not be found.")
        }
        add.parent = this
        this.nodes.splice(existIndex, 0, add)
        return this
    }

    /**
     * Insert new node after old node within the container.
     */
    public insertAfter(exist: INode, add: INode): this {
        const existIndex = this.nodes.indexOf(exist)
        if (existIndex < 0) {
            throw new Error("The given node could not be found.")
        }
        add.parent = this
        this.nodes.splice(existIndex + 1, 0, add)
        return this
    }

    /**
     * remove all child nodes
     */
    public removeAll(): this {
        for (const node of this.nodes) {
            node.parent = null
        }
        this.nodes = []
        return this
    }

    /**
     * remove child node
     */
    public removeChild(child: INode): this {
        const index = this.nodes.indexOf(child)
        this.nodes[index].parent = null
        this.nodes.splice(index, 1)
        return this
    }

    /**
     * The container’s first child.
     */
    public get first(): INode | null {
        return this.nodes[0] || null
    }

    /**
     * The container’s last child.
     */
    public get last(): INode | null {
        return this.nodes[this.nodes.length - 1] || null
    }
}

/**
 * Number value
 */
export class NumberValueImpl extends AbsNode implements NumberValue {
    public type: "Number"
    public value: number
    public raws: {
        before: string
        value: {
            raw: string
            value: number
        }
    }
    public source?: SourceLocation

    /**
     * constructor
     */
    public constructor(value: string, before = "", source?: SourceLocation) {
        super()
        const num = parseFloat(value)
        this.type = "Number"
        this.value = num
        this.raws = {
            before,
            value: {
                raw: value,
                value: num,
            },
        }
        this.source = source
    }
}

abstract class AbsNumWithUnitValue<T extends string, U> extends AbsNode {
    public type: T
    public value: number
    public unit: U
    public raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        unit?: {
            raw: string
            value: U
        }
    }
    public source?: SourceLocation

    /**
     * constructor
     */
    public constructor(
        type: T,
        value: string,
        unit: U,
        before: string,
        source?: SourceLocation,
    ) {
        super()
        const num = parseFloat(value)
        this.type = type
        this.value = num
        this.unit = unit
        this.raws = {
            before,
            value: {
                raw: value,
                value: num,
            },
        }
        this.source = source
    }
}

/**
 * Length value
 */
export class LengthValueImpl extends AbsNumWithUnitValue<"Length", LengthUnit>
    implements LengthValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: LengthUnit,
        before = "",
        source?: SourceLocation,
    ) {
        super("Length", value, unit, before, source)
    }
}

/**
 * Angle value
 */
export class AngleValueImpl extends AbsNumWithUnitValue<"Angle", AngleUnit>
    implements AngleValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AngleUnit,
        before = "",
        source?: SourceLocation,
    ) {
        super("Angle", value, unit, before, source)
    }
}

/**
 * Time value
 */
export class TimeValueImpl extends AbsNumWithUnitValue<"Time", TimeUnit>
    implements TimeValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: TimeUnit,
        before = "",
        source?: SourceLocation,
    ) {
        super("Time", value, unit, before, source)
    }
}

/**
 * Frequency value
 */
export class FrequencyValueImpl
    extends AbsNumWithUnitValue<"Frequency", FrequencyUnit>
    implements FrequencyValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: FrequencyUnit,
        before = "",
        source?: SourceLocation,
    ) {
        super("Frequency", value, unit, before, source)
    }
}

/**
 * Resolution value
 */
export class ResolutionValueImpl
    extends AbsNumWithUnitValue<"Resolution", ResolutionUnit>
    implements ResolutionValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: ResolutionUnit,
        before = "",
        source?: SourceLocation,
    ) {
        super("Resolution", value, unit, before, source)
    }
}

/**
 * Percentage value
 */
export class PercentageValueImpl extends AbsNumWithUnitValue<"Percentage", "%">
    implements PercentageValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: "%",
        before = "",
        source?: SourceLocation,
    ) {
        super("Percentage", value, unit, before, source)
    }
}

/**
 * Flex value
 */
export class FlexValueImpl extends AbsNumWithUnitValue<"Flex", FlexUnit>
    implements FlexValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: FlexUnit,
        before = "",
        source?: SourceLocation,
    ) {
        super("Flex", value, unit, before, source)
    }
}

abstract class AbsTokenValue<
    T extends string,
    V extends string
> extends AbsNode {
    public type: T
    public value: V
    public raws: {
        before: string
    }
    public source?: SourceLocation

    /**
     * constructor
     */
    public constructor(
        type: T,
        value: V,
        before: string,
        source?: SourceLocation,
    ) {
        super()
        this.type = type
        this.value = value
        this.raws = {
            before,
        }
        this.source = source
    }
}

/**
 * Unknown value or word
 */
export class WordImpl extends AbsTokenValue<"Word", string> implements Word {
    /**
     * constructor
     */
    public constructor(value: string, before = "", source?: SourceLocation) {
        super("Word", value, before, source)
    }
}

/**
 * String
 */
export class StringNodeImpl extends AbsTokenValue<"String", string>
    implements StringNode {
    /**
     * constructor
     */
    public constructor(value: string, before = "", source?: SourceLocation) {
        super("String", value, before, source)
    }
}

/**
 * Define accessor
 */
function defineAssessor<O, N extends keyof O>(
    obj: O,
    name: N,
    postSet: (n: O[N], o?: O[N]) => void,
) {
    const localName = `_${name}`
    Object.defineProperties(obj, {
        [localName]: { writable: true, enumerable: false },
        [name]: {
            get() {
                return this[localName]
            },
            set(n: O[N]) {
                const o = this[localName]
                this[localName] = n
                postSet(n, o)
            },
            enumerable: true,
        },
    })
}

/**
 * Math expression
 */
export class MathExpressionImpl extends AbsNode implements MathExpression {
    public type: "MathExpression"

    public left: Expression
    public operator: "+" | "-" | "*" | "/"
    public right: Expression
    public raws: {
        before: string
        between: string
    }
    public source?: {
        operator: SourceLocation
    } & SourceLocation
    /**
     * constructor
     */
    public constructor(
        left: Expression,
        operator: "+" | "-" | "*" | "/" | Operator,
        right: Expression,
        before = "",
        source?: {
            operator: SourceLocation
        } & SourceLocation,
    ) {
        super()
        let ope: "+" | "-" | "*" | "/"
        let between: string
        if (typeof operator === "string") {
            ope = operator
            between = ""
        } else {
            ope = operator.value
            between = operator.raws.before
        }
        this.type = "MathExpression"
        defineAssessor(
            this,
            "left",
            (n: Expression, o?: Expression): void => {
                n.parent = this
                if (o) {
                    o.parent = null
                }
            },
        )
        this.left = left
        this.operator = ope
        defineAssessor(
            this,
            "right",
            (n: Expression, o?: Expression): void => {
                n.parent = this
                if (o) {
                    o.parent = null
                }
            },
        )
        this.right = right
        this.raws = { before, between }
        this.source = source
    }
}

/**
 * FunctionNode
 */
export class FunctionNodeImpl extends AbsContainer implements FunctionNode {
    public type: "Function"
    public nodes: Expression[]
    public name: string
    public raws: {
        before: string
        beforeClose?: string
    }
    public source?: SourceLocation
    public unclosed?: boolean
    /**
     * constructor
     */
    public constructor(name: string, before = "", source?: SourceLocation) {
        super()
        this.type = "Function"
        this.name = name
        this.nodes = []
        this.raws = { before }
        this.source = source
    }
}

/**
 * Parentheses
 */
export class ParenthesesImpl extends AbsContainer implements Parentheses {
    public type: "Parentheses"
    public nodes: Expression[]
    public raws: {
        before: string
        beforeClose?: string
    }
    public source?: SourceLocation
    public unclosed?: boolean
    /**
     * constructor
     */
    public constructor(before = "", source?: SourceLocation) {
        super()
        this.type = "Parentheses"
        this.nodes = []
        this.raws = { before }
        this.source = source
    }
}
/**
 * Punctuator
 */
export class PunctuatorImpl extends AbsTokenValue<"Punctuator", "," | "(" | ")">
    implements Punctuator {
    /**
     * constructor
     */
    public constructor(
        value: "," | "(" | ")",
        before = "",
        source?: SourceLocation,
    ) {
        super("Punctuator", value, before, source)
    }
}

/**
 * Root
 */
export class RootImpl extends AbsContainer implements Root {
    public type: "Root"
    public nodes: Expression[]
    public tokens: Token[]
    public errors: ParseError[]
    public raws: { after: string }
    public source?: SourceLocation
    /**
     * constructor
     */
    public constructor(source?: SourceLocation) {
        super()
        this.type = "Root"
        this.nodes = []
        this.tokens = []
        this.errors = []
        this.raws = { after: "" }
        this.source = source
    }
}

/**
 * Operator
 */
export class OperatorImpl
    extends AbsTokenValue<"Operator", "+" | "-" | "*" | "/">
    implements Operator {
    /**
     * constructor
     */
    public constructor(
        value: "+" | "-" | "*" | "/",
        before = "",
        source?: SourceLocation,
    ) {
        super("Operator", value, before, source)
    }
}
