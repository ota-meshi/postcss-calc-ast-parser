import * as AST from "../types/ast"

import { Tokenizer } from "./tokenizer"
import { Options } from "../types/options"
import * as Impl from "./util/node-impl"
import {
    newWordNode,
    newFunction,
    newParentheses,
    newMathExpression,
    newString,
    newOperator,
    newPunctuator,
} from "./factory"
import { isMathFunction } from "./util/calc-notation"
import { isComma } from "./util/utils"

const MAYBE_FUNCTION = /^([^-+0-9.]|-[^+0-9.])/u
const MAYBE_MINUS = /^-[0-9.]/u
const PRECEDENCE = {
    "*": 3,
    "/": 3,
    "+": 2,
    "-": 2,
}

type TokenSet = {
    token:
        | AST.OperatorToken
        | AST.PunctuatorToken
        | AST.WordToken
        | AST.StringToken
    raws: string
}

type StateContainer = {
    container: AST.Root | AST.FunctionNode | AST.Parentheses
    parent?: StateContainer
    fnName: string
    post(token: AST.PunctuatorToken, before: string): void
    eof(): void
}

/**
 * Get the location from given node
 */
function srcLoc(node: AST.INode): AST.SourceLocation {
    return node.source || { start: { index: 0 }, end: { index: 0 } }
}

/**
 * checks whether the given node is expression.
 */
function isExpression(
    node: AST.Expression | AST.Other | void,
): node is AST.Expression {
    return (
        (node && node.type !== "Punctuator" && node.type !== "Operator") ||
        false
    )
}

/**
 * The parser of CSS `calc()`.
 */
export class Parser {
    private tokenizer: Tokenizer
    private root: AST.Root
    private tokens: AST.Token[]
    private errors: AST.ParseError[]
    private rescans: TokenSet[]

    /**
     * Initialize this parser.
     * @param tokenizer The tokenizer to parse.
     * @param options The parser options.
     */
    public constructor(tokenizer: Tokenizer, _options?: Options) {
        this.tokenizer = tokenizer
        // this.options = options
        this.root = new Impl.Root({
            start: { index: 0 },
            end: { index: 0 },
        })
        this.rescans = []

        this.tokens = this.root.tokens
        this.errors = this.root.errors
    }

    /**
     * Parse the `calc()` which was given in this constructor.
     * @returns The result of parsing.
     */
    public parse(): AST.Root {
        let state: StateContainer | null = {
            container: this.root,
            fnName: "",
            post() {
                // noop
            },
            eof() {
                // noop
            },
        }
        while (state) {
            state = this.processExpressions(state)
        }

        const { tokens } = this
        if (tokens.length > 0) {
            srcLoc(this.root).end.index =
                tokens[tokens.length - 1].source.end.index
        }
        this.errors.unshift(...this.tokenizer.errors)
        this.errors.sort((e1, e2) => e1.index - e2.index)

        return this.root
    }

    /**
     * Report an invalid character error.
     * @param code The error code.
     */
    private reportParseError(code: AST.ErrorCode, index = 0): void {
        if (this.errors.find(e => e.code === code && e.index === index)) {
            return // duplicate
        }

        const error = AST.ParseError.fromCode(code, index)
        this.errors.push(error)
    }

    /**
     * Process expressions
     * @param state current processing status
     * @returns next processing status
     */
    private processExpressions(state: StateContainer): StateContainer | null {
        let tokenSet
        while ((tokenSet = this.scan())) {
            const { token } = tokenSet
            switch (token.type) {
                case "word":
                    if (MAYBE_FUNCTION.test(token.value)) {
                        const next = this.scan()
                        if (next) {
                            if (
                                !next.raws &&
                                next.token.type === "punctuator" &&
                                next.token.value === "("
                            ) {
                                // is functiuon
                                return this.processFunction(
                                    token,
                                    tokenSet.raws,
                                    next.token,
                                    state,
                                )
                            }
                            this.back(next)
                        }
                    } else if (
                        isMathFunction(state.fnName) &&
                        MAYBE_MINUS.test(token.value)
                    ) {
                        const last = state.container.last as
                            | AST.Expression
                            | AST.Other
                            | void
                        if (last && isExpression(last)) {
                            // e.g. `cal( ... 10px -10 ... )`
                            this.back(
                                ...this.replaceToken(
                                    tokenSet,
                                    "-",
                                    token.value.slice(1),
                                ),
                            )
                            break
                        }
                    }
                    state.container.push(newWordNode(token, tokenSet.raws))
                    break
                case "string":
                    state.container.push(newString(token, tokenSet.raws))
                    break
                case "operator":
                    this.checkAndMergeMathExpr(state, PRECEDENCE[token.value])
                    state.container.push(newOperator(token, tokenSet.raws))
                    break
                case "punctuator":
                    this.checkAndMergeMathExpr(state)
                    return this.processPunctuator(token, tokenSet.raws, state)
                default:
                    break
            }
        }
        this.postStack(state)
        state.eof()
        return null
    }

    /**
     * Check if can merge of the stack as a math expression and merge it if it can be merge.
     */
    private checkAndMergeMathExpr(
        state: StateContainer,
        currPrecedence?: number,
    ) {
        const { container } = state
        const { nodes } = container
        if (nodes.length >= 3) {
            const bfOp = nodes[nodes.length - 2] as AST.Expression | AST.Other
            if (bfOp.type === "Operator" && PRECEDENCE[bfOp.value]) {
                if (
                    currPrecedence == null ||
                    currPrecedence <= PRECEDENCE[bfOp.value]
                ) {
                    const math = this.mergeMathExpr(state)
                    if (math) {
                        container.push(math)
                    }
                }
            }
        }
    }

    /**
     * Process punctuator
     * @param token current token
     * @param before current token before
     * @param state current processing status
     * @returns next processing status
     */
    private processPunctuator(
        token: AST.PunctuatorToken,
        before: string,
        state: StateContainer,
    ): StateContainer {
        const { container, parent } = state
        if (token.value === "(") {
            const node = newParentheses(token, before)
            container.push(node)
            return this.createNestedStateContainer(node, state.fnName, state)
        }
        this.postStack(state)
        if (token.value === ")") {
            if (parent) {
                state.post(token, before)
                return parent
            }
            this.reportParseError(
                "unexpected-parenthesis",
                token.source.start.index,
            )
        }
        // if (token.value === ",") {
        //     stack.push(newNode(token, before))
        //     return state
        // }
        container.push(newPunctuator(token, before))
        return state
    }

    /**
     * Process function
     * @param token current token
     * @param before current token before
     * @param state current processing status
     * @returns next processing status
     */
    private processFunction(
        token: AST.WordToken,
        before: string,
        open: AST.PunctuatorToken,
        state: StateContainer,
    ): StateContainer {
        const node = newFunction(token, before, open)
        state.container.push(node)
        return this.createNestedStateContainer(node, node.name, state)
    }

    /**
     * Create new nested StateContainer
     */
    private createNestedStateContainer(
        node: AST.FunctionNode | AST.Parentheses,
        fnName: string,
        state: StateContainer,
    ): StateContainer {
        return {
            container: node,
            parent: state,
            fnName,
            post(close, beforeClose) {
                if (beforeClose) {
                    node.raws.beforeClose = beforeClose
                }
                srcLoc(node).end = close.source.end
            },
            eof: () => {
                node.unclosed = true
                const last = this.tokens[this.tokens.length - 1]
                const lastChild = node.last
                if (lastChild) {
                    srcLoc(node).end = srcLoc(lastChild).end
                }
                this.reportParseError("eof-in-bracket", last.source.end.index)
                state.eof()
            },
        }
    }

    /**
     * Create MathExpression node
     * @returns MathExpression node
     */
    private mergeMathExpr(state: StateContainer): AST.MathExpression | null {
        const {
            container: { nodes },
        } = state
        const right = nodes.pop() as AST.Expression | AST.Other
        const op = nodes.pop() as AST.Expression | AST.Other
        const left = nodes.pop() || null

        const restore = () => {
            if (left) {
                nodes.push(left) // restore
            }
            nodes.push(op, right) // restore
        }
        const reportError = (node: AST.Expression | AST.Other) => {
            if (isMathFunction(state.fnName)) {
                this.reportParseError(
                    "unexpected-calc-token",
                    srcLoc(node).start.index,
                )
            }
        }
        if (isComma(op)) {
            if (!isExpression(right)) {
                // e.g `, - `, `, + `
                reportError(right)
            }
            restore()
            return null
        }

        if (!left) {
            reportError(isExpression(op) ? right : op)
            restore()
            return null
        }
        if (!isExpression(left)) {
            reportError(isExpression(nodes[nodes.length - 1]) ? op : left)
            restore()
            return null
        }
        if (op.type !== "Operator") {
            reportError(op)
            restore()
            return null
        }
        if (!isExpression(right)) {
            reportError(right)
            restore()
            return null
        }
        return newMathExpression(left, op, right)
    }

    /**
     * Do the last processing of the node stack.
     */
    private postStack(state: StateContainer) {
        const { container } = state
        const { nodes } = container
        while (nodes.length > 1) {
            const math = this.mergeMathExpr(state)
            if (math) {
                container.push(math)
            } else {
                return
            }
        }
    }

    /**
     * Scan the tokenset.
     * @returns The scaned tokenset or null.
     */
    private scan(): TokenSet | null {
        const re = this.rescans.shift()
        if (re) {
            return re
        }

        let raws = ""

        let token = this.tokenizer.nextToken()
        while (token) {
            this.tokens.push(token)
            if (
                token.type === "whitespace" ||
                token.type === "comment" ||
                token.type === "inline-comment"
            ) {
                raws += token.value
            } else {
                return { token, raws }
            }
            token = this.tokenizer.nextToken()
        }
        // end
        if (raws) {
            this.root.raws.after = raws
        }
        return null
    }

    /**
     * Rescan the given tokenset in the next scan.
     * @param tokensets The tokensets.
     */
    private back(...tokensets: TokenSet[]): void {
        this.rescans.unshift(...tokensets)
    }

    /**
     * Replace the token.
     */
    private replaceToken(
        tokenset: TokenSet,
        ...newValues: string[]
    ): TokenSet[] {
        const result: TokenSet[] = []
        let raws = tokenset.raws
        let startLoc = { index: tokenset.token.source.start.index }
        for (const value of newValues) {
            const endLoc = { index: startLoc.index + value.length }
            const source = { start: startLoc, end: endLoc }
            const token:
                | AST.OperatorToken
                | AST.PunctuatorToken
                | AST.WordToken =
                value === "-" || value === "+" || value === "*" || value === "/"
                    ? { value, type: "operator", source }
                    : value === "," || value === "(" || value === ")"
                        ? { value, type: "punctuator", source }
                        : { value, type: "word", source }
            result.push({ raws, token })
            raws = ""
            startLoc = endLoc
        }
        const index = this.tokens.indexOf(tokenset.token)
        this.tokens.splice(index, 1, ...result.map(s => s.token))

        return result
    }
}
