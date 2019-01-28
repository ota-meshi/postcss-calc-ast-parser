import * as AST from "../../types/ast"

import { Stringifier } from "../stringifier"
type Stringify = (
    node:
        | AST.INode // nodes
        | AST.IToken, // tokens
) => string
let defaultStringifier: Stringifier | null = null

/**
 * Node core API
 */
abstract class Node implements AST.INode {
    public abstract type: string
    public abstract raws:
        | {
              before: string
          }
        | {
              after: string
          }
    public abstract source: AST.SourceLocation
    public parent: AST.IContainer | null = null
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
abstract class Container extends Node implements AST.IContainer {
    public abstract nodes: AST.INode[]

    /**
     * Push Node
     */
    public push(...children: AST.INode[]): this {
        for (const child of children) {
            if (child.type === "Root") {
                this.push(...(child as AST.Root).nodes)
            } else {
                child.parent = this
                this.nodes.push(child)
            }
        }
        return this
    }
    /**
     * Unshift Node
     */
    public unshift(...children: AST.INode[]): this {
        for (const child of children.reverse()) {
            if (child.type === "Root") {
                this.unshift(...(child as AST.Root).nodes)
            } else {
                child.parent = this
                this.nodes.unshift(child)
            }
        }
        return this
    }

    /**
     * Inserts new nodes to the end of the container.
     */
    public append(...children: AST.INode[]): this {
        return this.push(...children)
    }

    /**
     * Inserts new nodes to the start of the container.
     */
    public prepend(...children: AST.INode[]): this {
        return this.unshift(...children)
    }

    /**
     * Insert new node before old node within the container.
     */
    public insertBefore(exist: AST.INode, add: AST.INode): this {
        if (add.type === "Root") {
            const { nodes } = add as AST.Root
            if (nodes.length === 1) {
                return this.insertBefore(exist, nodes[0])
            }
            throw new Error("The given Root node is illegal.")
        }
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
    public insertAfter(exist: AST.INode, add: AST.INode): this {
        if (add.type === "Root") {
            const { nodes } = add as AST.Root
            if (nodes.length === 1) {
                return this.insertAfter(exist, nodes[0])
            }
            throw new Error("The given Root node is illegal.")
        }
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
    public removeChild(child: AST.INode): this {
        const index = this.nodes.indexOf(child)
        this.nodes[index].parent = null
        this.nodes.splice(index, 1)
        return this
    }

    /**
     * The container’s first child.
     */
    public get first(): AST.INode | null {
        return this.nodes[0] || null
    }

    /**
     * The container’s last child.
     */
    public get last(): AST.INode | null {
        return this.nodes[this.nodes.length - 1] || null
    }
}

/**
 * Number value
 */
export class NumberValue extends Node implements AST.NumberValue {
    public type: "Number"
    public value: number
    public raws: {
        before: string
        value: {
            raw: string
            value: number
        }
    }
    public source: AST.SourceLocation

    /**
     * constructor
     */
    public constructor(
        value: string,
        before: string,
        source: AST.SourceLocation,
    ) {
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

abstract class NumWithUnitValue<T extends string, U> extends Node {
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
    public source: AST.SourceLocation

    /**
     * constructor
     */
    public constructor(
        type: T,
        value: string,
        unit: U,
        before: string,
        source: AST.SourceLocation,
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
export class LengthValue extends NumWithUnitValue<"Length", AST.LengthUnit>
    implements AST.LengthValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AST.LengthUnit,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Length", value, unit, before, source)
    }
}

/**
 * Angle value
 */
export class AngleValue extends NumWithUnitValue<"Angle", AST.AngleUnit>
    implements AST.AngleValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AST.AngleUnit,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Angle", value, unit, before, source)
    }
}

/**
 * Time value
 */
export class TimeValue extends NumWithUnitValue<"Time", AST.TimeUnit>
    implements AST.TimeValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AST.TimeUnit,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Time", value, unit, before, source)
    }
}

/**
 * Frequency value
 */
export class FrequencyValue
    extends NumWithUnitValue<"Frequency", AST.FrequencyUnit>
    implements AST.FrequencyValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AST.FrequencyUnit,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Frequency", value, unit, before, source)
    }
}

/**
 * Resolution value
 */
export class ResolutionValue
    extends NumWithUnitValue<"Resolution", AST.ResolutionUnit>
    implements AST.ResolutionValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AST.ResolutionUnit,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Resolution", value, unit, before, source)
    }
}

/**
 * Percentage value
 */
export class PercentageValue extends NumWithUnitValue<"Percentage", "%">
    implements AST.PercentageValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: "%",
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Percentage", value, unit, before, source)
    }
}

/**
 * Flex value
 */
export class FlexValue extends NumWithUnitValue<"Flex", AST.FlexUnit>
    implements AST.FlexValue {
    /**
     * constructor
     */
    public constructor(
        value: string,
        unit: AST.FlexUnit,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Flex", value, unit, before, source)
    }
}

abstract class TokenValue<T extends string, V extends string> extends Node {
    public type: T
    public value: V
    public raws: {
        before: string
    }
    public source: AST.SourceLocation

    /**
     * constructor
     */
    public constructor(
        type: T,
        value: V,
        before: string,
        source: AST.SourceLocation,
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
export class Word extends TokenValue<"Word", string> implements AST.Word {
    /**
     * constructor
     */
    public constructor(
        value: string,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Word", value, before, source)
    }
}

/**
 * String
 */
export class StringNode extends TokenValue<"String", string>
    implements AST.StringNode {
    /**
     * constructor
     */
    public constructor(
        value: string,
        before: string,
        source: AST.SourceLocation,
    ) {
        super("String", value, before, source)
    }
}

/**
 * Define accessor
 */
function defineAssessor<O, N extends keyof O>(
    obj: O,
    name: N,
    preset: (n: O[N], o?: O[N]) => O[N],
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
                this[localName] = preset(n, o)
            },
            enumerable: true,
        },
    })
}

/**
 * Math expression
 */
export class MathExpression extends Node implements AST.MathExpression {
    public type: "MathExpression"

    public left: AST.Expression
    public operator: "+" | "-" | "*" | "/"
    public right: AST.Expression
    public raws: {
        before: string
        between: string
    }
    public source: {
        operator: AST.SourceLocation
    } & AST.SourceLocation
    /**
     * constructor
     */
    public constructor(
        left: AST.Expression,
        operator: AST.Operator,
        right: AST.Expression,
        before: string,
        source: {
            operator: AST.SourceLocation
        } & AST.SourceLocation,
    ) {
        super()
        const ope = operator.value
        const between = operator.raws.before
        this.type = "MathExpression"
        defineAssessor(
            this,
            "left",
            (
                n: AST.Expression | AST.Root,
                o?: AST.Expression | AST.Root,
            ): AST.Expression => {
                if (n.type === "Root") {
                    const { nodes } = n
                    if (nodes.length === 1) {
                        n = nodes[0] as AST.Expression // eslint-disable-line no-param-reassign
                    } else {
                        throw new Error("The given Root node is illegal.")
                    }
                }
                n.parent = this
                if (o) {
                    o.parent = null
                }
                return n
            },
        )
        this.left = left
        this.operator = ope
        defineAssessor(
            this,
            "right",
            (
                n: AST.Expression | AST.Root,
                o?: AST.Expression | AST.Root,
            ): AST.Expression => {
                if (n.type === "Root") {
                    const { nodes } = n
                    if (nodes.length === 1) {
                        n = nodes[0] as AST.Expression // eslint-disable-line no-param-reassign
                    } else {
                        throw new Error("The given Root node is illegal.")
                    }
                }
                n.parent = this
                if (o) {
                    o.parent = null
                }
                return n
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
export class FunctionNode extends Container implements AST.FunctionNode {
    public type: "Function"
    public nodes: AST.Expression[]
    public name: string
    public raws: {
        before: string
        beforeClose?: string
    }
    public source: AST.SourceLocation
    public unclosed?: boolean
    /**
     * constructor
     */
    public constructor(
        name: string,
        before: string,
        source: AST.SourceLocation,
    ) {
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
export class Parentheses extends Container implements AST.Parentheses {
    public type: "Parentheses"
    public nodes: AST.Expression[]
    public raws: {
        before: string
        beforeClose?: string
    }
    public source: AST.SourceLocation
    public unclosed?: boolean
    /**
     * constructor
     */
    public constructor(before: string, source: AST.SourceLocation) {
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
export class Punctuator extends TokenValue<"Punctuator", "," | ")">
    implements AST.Punctuator {
    /**
     * constructor
     */
    public constructor(
        value: "," | ")",
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Punctuator", value, before, source)
    }
}

/**
 * Root
 */
export class Root extends Container implements AST.Root {
    public type: "Root"
    public nodes: AST.Expression[]
    public tokens: AST.Token[]
    public errors: AST.ParseError[]
    public raws: { after: string }
    public source: AST.SourceLocation
    /**
     * constructor
     */
    public constructor(source: AST.SourceLocation) {
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
export class Operator extends TokenValue<"Operator", "+" | "-" | "*" | "/">
    implements AST.Operator {
    /**
     * constructor
     */
    public constructor(
        value: "+" | "-" | "*" | "/",
        before: string,
        source: AST.SourceLocation,
    ) {
        super("Operator", value, before, source)
    }
}
