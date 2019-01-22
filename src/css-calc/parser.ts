import {
    ParseError,
    Token,
    Root,
    Expression,
    OperatorToken,
    PunctuatorToken,
    WordToken,
    StringToken,
    SourceLocation,
    ErrorCode,
    MathExpression,
    Parentheses,
    FunctionNode,
    INode,
    IContainer,
    Other,
} from "../types/ast"

import { Tokenizer } from "./tokenizer"
import { Options } from "../types/options"
import { RootImpl } from "./util/nodes"
import {
    newNode,
    newParenthesesNode,
    newFunctionNode,
    newMathExpressionNode,
} from "./factory"
import { isMathFunction } from "./util/calc-notation"
import { isComma } from "./util/utils"

const MAYBE_FUNCTION = /^([^-+0-9.]|-[^+0-9.])/u
const PRECEDENCE = {
    "*": 3,
    "/": 3,
    "+": 2,
    "-": 2,
}

type TokenSet = {
    token: OperatorToken | PunctuatorToken | WordToken | StringToken
    raws: string
}

type StateContainer = {
    container: IContainer
    parent?: StateContainer
    fnName: string
    post(token: PunctuatorToken, before: string): void
    eof(): void
}

/**
 * Get the location from given node
 */
function srcLoc(node: INode): SourceLocation {
    return node.source || { start: { index: 0 }, end: { index: 0 } }
}

/**
 * checks whether the given node is expression.
 */
function isExpression(node: Expression | Other): Expression | null {
    if (node.type !== "Punctuator" && node.type !== "Operator") {
        return node
    }
    return null
}

/**
 * The parser of CSS `calc()`.
 */
export class Parser {
    private tokenizer: Tokenizer
    private root: Root
    private tokens: Token[]
    private errors: ParseError[]
    private reconsumes: TokenSet[]

    /**
     * Initialize this parser.
     * @param tokenizer The tokenizer to parse.
     * @param options The parser options.
     */
    public constructor(tokenizer: Tokenizer, _options?: Options) {
        this.tokenizer = tokenizer
        // this.options = options
        this.root = new RootImpl({
            start: {
                index: 0,
            },
            end: {
                index: 0,
            },
        })
        this.reconsumes = []

        this.tokens = this.root.tokens
        this.errors = this.root.errors
    }

    /**
     * Parse the `calc()` which was given in this constructor.
     * @returns The result of parsing.
     */
    public parse(): Root {
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
    private reportParseError(code: ErrorCode, index = 0): void {
        if (this.errors.find(e => e.code === code && e.index === index)) {
            return // duplicate
        }

        const error = ParseError.fromCode(code, index)
        this.errors.push(error)
    }

    /**
     * Process expressions
     * @param state current processing status
     * @returns next processing status
     */
    private processExpressions(state: StateContainer): StateContainer | null {
        let tokenSet
        while ((tokenSet = this.consumeToken())) {
            const { token } = tokenSet
            switch (token.type) {
                case "word":
                    if (MAYBE_FUNCTION.test(token.value)) {
                        const next = this.consumeToken()
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
                            this.reconsume(next)
                        }
                    }
                    state.container.push(newNode(token, tokenSet.raws))
                    break
                case "string":
                    state.container.push(newNode(token, tokenSet.raws))
                    break
                case "operator":
                    this.checkAndMergeMathExpr(state, PRECEDENCE[token.value])
                    state.container.push(newNode(token, tokenSet.raws))
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
        const stack = container.nodes
        if (stack.length >= 3) {
            const bfOp = stack[stack.length - 2] as Expression | Other
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
        token: PunctuatorToken,
        before: string,
        state: StateContainer,
    ): StateContainer {
        const { container, parent } = state
        if (token.value === "(") {
            const node = newParenthesesNode(token, before)
            container.push(node)
            return this.createNestedStateContainer(node, state.fnName, state)
        }
        this.postStack(state)
        if (token.value === ")") {
            if (parent) {
                state.post(token, before)
                return parent
            }
        }
        // if (token.value === ",") {
        //     stack.push(newNode(token, before))
        //     return state
        // }
        container.push(newNode(token, before))
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
        token: WordToken,
        before: string,
        open: PunctuatorToken,
        state: StateContainer,
    ): StateContainer {
        const node = newFunctionNode(token, before, open)
        state.container.push(node)
        return this.createNestedStateContainer(node, node.name, state)
    }

    /**
     * Create new nested StateContainer
     */
    private createNestedStateContainer(
        node: FunctionNode | Parentheses,
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
    private mergeMathExpr(state: StateContainer): MathExpression | null {
        const {
            container: { nodes },
        } = state
        const right = nodes.pop() as Expression | Other
        const op = nodes.pop() as Expression | Other
        const left = (nodes.pop() || null) as Expression | Other | null

        const restore = () => {
            if (left) {
                nodes.push(left) // restore
            }
            nodes.push(op) // restore
            nodes.push(right) // restore
        }
        const reportError = (node: Expression | Other) => {
            if (isMathFunction(state.fnName)) {
                this.reportParseError(
                    "unexpected-calc-token",
                    srcLoc(node).start.index,
                )
            }
        }
        const rightExpr = isExpression(right)
        if (isComma(op)) {
            if (!rightExpr) {
                // e.g `, - `, `, + `
                reportError(right)
            }
            restore()
            return null
        }

        if (!left) {
            reportError(op.type !== "Operator" ? right : op)
            restore()
            return null
        }
        const leftExpr = isExpression(left)
        if (!leftExpr) {
            reportError(left)
            restore()
            return null
        }
        if (op.type !== "Operator") {
            reportError(op)
            restore()
            return null
        }
        if (!rightExpr) {
            reportError(right)
            restore()
            return null
        }
        return newMathExpressionNode(leftExpr, op, rightExpr)
    }

    /**
     * Do the last processing of the node stack.
     */
    private postStack(state: StateContainer) {
        const { container } = state
        const stack = container.nodes
        while (stack.length > 1) {
            const math = this.mergeMathExpr(state)
            if (math) {
                container.push(math)
            } else {
                return
            }
        }
    }

    /**
     * Consume the curr tokenset.
     * @returns The consumed tokenset or null.
     */
    private consumeToken(): TokenSet | null {
        const result = this.reconsumes.shift()
        if (result) {
            return result
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
                return {
                    token,
                    raws,
                }
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
     * Directive reconsuming the given tokenset.
     * @param tokenset The tokenset.
     */
    private reconsume(tokenset: TokenSet): void {
        this.reconsumes.unshift(tokenset)
    }
}
