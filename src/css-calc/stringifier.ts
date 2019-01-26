import {
    Expression,
    Root,
    FunctionNode,
    Parentheses,
    MathExpression,
    NumberValue,
    Word,
    Punctuator,
    Operator,
    LengthValue,
    AngleValue,
    TimeValue,
    FrequencyValue,
    ResolutionValue,
    FlexValue,
    PercentageValue,
    WordToken,
    PunctuatorToken,
    OperatorToken,
    WhitespaceToken,
    CommentToken,
    StringToken,
    InlineCommnetToken,
    Node,
    IToken,
    INode,
    Other,
} from "../types/ast"
import { StringifyOptions } from "../types/options"

/**
 * Get raw value or name value
 */
function rawVal<T extends Node>(node: T, name: keyof T): string {
    const r = (node.raws as any)[name]
    return r ? r.raw : `${node[name]}`
}

/**
 * Get raw value or ""
 */
function raw<T extends Node>(node: T, name: keyof T["raws"]): string {
    const r = (node.raws as any)[name]
    return r || ""
}

/**
 * Stringify the given expression
 */
function wrapRaws(node: Expression | Other, inner: string): string {
    return `${raw(node, "before")}${inner}`
}

/**
 * Stringify the given expression
 */
function numWithUnit(
    node:
        | LengthValue
        | AngleValue
        | TimeValue
        | FrequencyValue
        | ResolutionValue
        | FlexValue
        | PercentageValue,
): string {
    return wrapRaws(node, `${rawVal(node, "value")}${rawVal(node, "unit")}`)
}

/**
 * Stringifier for CSS `calc()`.
 */
export class Stringifier {
    private options: StringifyOptions
    /**
     * Initialize this tokenizer.
     * @param text The source code to tokenize.
     */
    public constructor(options?: StringifyOptions) {
        this.options = Object.assign(
            {
                autofix: false,
            },
            options || {},
        )
    }
    /**
     * Stringify the given node
     * @param node node to string
     */
    public stringify(
        node:
            | INode // nodes
            | IToken, // tokens
    ): string {
        return (this as any)[node.type](node)
    }

    /* eslint-disable require-jsdoc, class-methods-use-this */
    // nodes
    protected Root(node: Root): string {
        let s = ""
        for (const c of node.nodes) {
            s += this.stringify(c)
        }
        s += raw(node, "after")
        return s
    }
    protected Function(node: FunctionNode): string {
        let s = `${node.name}(`
        for (const c of node.nodes) {
            s += this.stringify(c)
        }
        s += raw(node, "beforeClose")
        if (this.options.autofix || !node.unclosed) {
            s += ")"
        }
        return wrapRaws(node, s)
    }
    protected Parentheses(node: Parentheses): string {
        let s = "("
        for (const c of node.nodes) {
            s += this.stringify(c)
        }
        s += raw(node, "beforeClose")
        if (this.options.autofix || !node.unclosed) {
            s += ")"
        }
        return wrapRaws(node, s)
    }
    protected MathExpression(node: MathExpression): string {
        return wrapRaws(
            node,
            `${this.stringify(node.left)}${raw(node, "between")}${
                node.operator
            }${this.stringify(node.right)}`,
        )
    }
    protected Number(node: NumberValue): string {
        return wrapRaws(node, rawVal(node, "value"))
    }
    protected Punctuator(node: Punctuator): string {
        return wrapRaws(node, node.value)
    }
    protected Word(node: Word): string {
        return wrapRaws(node, node.value)
    }
    protected String(node: Word): string {
        return wrapRaws(node, node.value)
    }
    protected Operator(node: Operator): string {
        return wrapRaws(node, node.value)
    }
    protected Length(node: LengthValue): string {
        return numWithUnit(node)
    }
    protected Angle(node: AngleValue): string {
        return numWithUnit(node)
    }
    protected Time(node: TimeValue): string {
        return numWithUnit(node)
    }
    protected Frequency(node: FrequencyValue): string {
        return numWithUnit(node)
    }
    protected Resolution(node: ResolutionValue): string {
        return numWithUnit(node)
    }
    protected Percentage(node: PercentageValue): string {
        return numWithUnit(node)
    }
    protected Flex(node: FlexValue): string {
        return numWithUnit(node)
    }
    // tokens
    protected word(node: WordToken): string {
        return node.value
    }
    protected punctuator(node: PunctuatorToken): string {
        return node.value
    }
    protected operator(node: OperatorToken): string {
        return node.value
    }
    protected whitespace(node: WhitespaceToken): string {
        return node.value
    }
    protected comment(node: CommentToken): string {
        return node.value
    }
    protected string(node: StringToken): string {
        return node.value
    }
    protected "inline-comment"(node: InlineCommnetToken): string {
        return node.value
    }
    /* eslint-enable require-jsdoc, class-methods-use-this */
}
