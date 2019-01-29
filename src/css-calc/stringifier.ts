import * as AST from "../types/ast"
import { StringifyOptions } from "../types/options"

/**
 * Get raw value or name value
 */
function rawVal<T extends AST.Node>(node: T, name: keyof T): string {
    const r = (node.raws as any)[name]
    return r ? r.raw : `${node[name]}`
}

/**
 * Get raw value or ""
 */
function raw<T extends AST.Node>(node: T, name: keyof T["raws"]): string {
    const r = (node.raws as any)[name]
    return r || ""
}

/**
 * Stringify the given expression
 */
function wrapRaws(node: AST.Expression | AST.Other, inner: string): string {
    return `${raw(node, "before")}${inner}`
}

/**
 * Stringify the given expression
 */
function numWithUnit(
    node:
        | AST.LengthValue
        | AST.AngleValue
        | AST.TimeValue
        | AST.FrequencyValue
        | AST.ResolutionValue
        | AST.FlexValue
        | AST.PercentageValue,
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
            | AST.INode // nodes
            | AST.IToken, // tokens
    ): string {
        return (this as any)[node.type](node)
    }

    /* eslint-disable require-jsdoc, class-methods-use-this */
    // nodes
    protected Root(node: AST.Root): string {
        let s = ""
        for (const c of node.nodes) {
            s += this.stringify(c)
        }
        s += raw(node, "after")
        return s
    }
    protected Function(node: AST.FunctionNode): string {
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
    protected Parentheses(node: AST.Parentheses): string {
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
    // eslint-disable-next-line complexity
    protected MathExpression(node: AST.MathExpression): string {
        let beforeLeft = ""
        let between = raw(node, "between")
        let beforeRight = ""
        let afterRight = ""
        if (this.options.autofix) {
            if (!between) {
                between = " "
            }
            if (!node.right.raws.before) {
                beforeRight = " "
            }

            if (node.left.type === "MathExpression") {
                // (X + Y) * Z
                // (X - Y) * Z
                // (X + Y) / Z
                // (X - Y) / Z
                if (
                    (node.left.operator === "+" ||
                        node.left.operator === "-") &&
                    (node.operator === "*" || node.operator === "/")
                ) {
                    beforeLeft += "("
                    between = `)${between}`
                }
            }
            if (node.right.type === "MathExpression") {
                if (
                    // X + (Y - Z)
                    (node.operator === "+" && node.right.operator === "-") ||
                    // X - (Y + Z)
                    // X - (Y - Z)
                    // X * (Y + Z)
                    // X * (Y - Z)
                    ((node.operator === "-" || node.operator === "*") &&
                        (node.right.operator === "+" ||
                            node.right.operator === "-")) ||
                    // X / (Y + Z)
                    // X / (Y - Z)
                    // X / (Y * Z)
                    // X / (Y / Z)
                    node.operator === "/"
                ) {
                    beforeRight += "("
                    afterRight = `)${afterRight}`
                }
            }
        }
        return wrapRaws(
            node,
            `${beforeLeft}${this.stringify(node.left)}${between}${
                node.operator
            }${beforeRight}${this.stringify(node.right)}${afterRight}`,
        )
    }
    protected Number(node: AST.NumberValue): string {
        return wrapRaws(node, rawVal(node, "value"))
    }
    protected Punctuator(node: AST.Punctuator): string {
        return wrapRaws(node, node.value)
    }
    protected Word(node: AST.Word): string {
        return wrapRaws(node, node.value)
    }
    protected String(node: AST.StringNode): string {
        return wrapRaws(node, node.value)
    }
    protected Operator(node: AST.Operator): string {
        return wrapRaws(node, node.value)
    }
    protected Length(node: AST.LengthValue): string {
        return numWithUnit(node)
    }
    protected Angle(node: AST.AngleValue): string {
        return numWithUnit(node)
    }
    protected Time(node: AST.TimeValue): string {
        return numWithUnit(node)
    }
    protected Frequency(node: AST.FrequencyValue): string {
        return numWithUnit(node)
    }
    protected Resolution(node: AST.ResolutionValue): string {
        return numWithUnit(node)
    }
    protected Percentage(node: AST.PercentageValue): string {
        return numWithUnit(node)
    }
    protected Flex(node: AST.FlexValue): string {
        return numWithUnit(node)
    }
    // tokens
    protected word(node: AST.WordToken): string {
        return node.value
    }
    protected punctuator(node: AST.PunctuatorToken): string {
        return node.value
    }
    protected operator(node: AST.OperatorToken): string {
        return node.value
    }
    protected whitespace(node: AST.WhitespaceToken): string {
        return node.value
    }
    protected comment(node: AST.CommentToken): string {
        return node.value
    }
    protected string(node: AST.StringToken): string {
        return node.value
    }
    protected "inline-comment"(node: AST.InlineCommnetToken): string {
        return node.value
    }
    /* eslint-enable require-jsdoc, class-methods-use-this */
}
