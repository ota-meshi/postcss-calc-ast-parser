/*eslint-disable no-param-reassign */
import * as AST from "../types/ast"
import {
    isWhitespace,
    isDigit,
    isLetter,
    EOF,
    NULL,
    CR,
    LF,
    FF,
    DQUOTE,
    SQUOTE,
    LPAREN,
    RPAREN,
    STAR,
    PLUS,
    COMMA,
    MINUS,
    DOT,
    SLASH,
    LBRACKET,
    BACKSLASH,
    RBRACKET,
    LBRACE,
    RBRACE,
} from "./util/unicode"
import { Options } from "../types/options"

/**
 * Enumeration of sacan state types.
 */
type ScanState =
    | "SCAN"
    | "WORD"
    | "WHITESPACE"
    | "MINUS" // `-`
    | "PLUS" // `+`
    | "SLASH" // `/`
    | "COMMENT" // `/*`
    | "DQUOTE" // `"`
    | "SQUOTE" // `'`
    | "LBRACKET" // `[`
    | "LBRACE" // `{`
    // unstandard
    | "INLINE_COMMENT" // `//`

/**
 * checks whether the given char is punctuator.
 * @param cc char
 * @returns `true` if the given char is punctuator
 */
function isPunctuator(cc: number): boolean {
    return cc === LPAREN || cc === RPAREN || cc === COMMA
}

/**
 * checks whether the given char is maybe number.
 * @param cc char
 * @returns `true` if the given char is maybe number.
 */
function maybeNumber(cc: number): boolean {
    return isDigit(cc) || cc === DOT
}

/**
 * checks whether the given char is quotes.
 * @param cc char
 * @returns `true` if the given char quotes
 */
function isQuotes(cc: number): boolean {
    return cc === DQUOTE || cc === SQUOTE
}

type LeftBracketCode = typeof LPAREN | typeof LBRACKET | typeof LBRACE
type RightBracketCode = typeof RPAREN | typeof RBRACKET | typeof RBRACE

/**
 * Gets the right bracket from the given char.
 * @param cc char
 * @returns the right bracket
 */
function getRightBracket(cc: LeftBracketCode): RightBracketCode {
    if (cc === LPAREN) {
        return RPAREN
    }
    if (cc === LBRACE) {
        return RBRACE
    }
    return RBRACKET
}

/**
 * Tokenizer for CSS `calc()`.
 */
export class Tokenizer {
    // Reading
    private text: string
    private lastCode: number = NULL
    private offset: number

    // Tokenizing
    private rescan = false
    private token: AST.Token | null = null
    private nextTokenOffset: number
    private lastTokenType: AST.TokenType | null = null

    private options: Options

    /**
     * The current state.
     */
    private state: ScanState

    /**
     * Syntax errors.
     */
    public errors: AST.ParseError[] = []

    /**
     * Initialize this tokenizer.
     */
    public constructor(text: string, options?: Options) {
        this.text = text
        this.offset = -1
        this.state = "SCAN"
        this.nextTokenOffset = 0

        this.options = Object.assign(
            {
                allowInlineCommnets: true,
            },
            options || {},
        )
    }

    /**
     * Get the next token.
     * @returns The next token or null.
     */
    public nextToken(): AST.Token | null {
        while (this.token == null) {
            const cc = this.scan()
            this.state = this[this.state](cc) || "SCAN"
            if (cc === EOF && !this.rescan) {
                break
            }
        }

        const { token } = this
        this.token = null
        return token
    }

    /**
     * Scan the curr char code.
     * @returns The scan char code.
     */
    private scan(): number {
        if (this.rescan) {
            this.rescan = false
            return this.lastCode
        }
        return this.next()
    }
    /**
     * Consume the next char code.
     * @returns The consumed char code.
     */
    private next(): number {
        if (this.offset < this.text.length) {
            this.offset++
        }

        if (this.offset >= this.text.length) {
            return (this.lastCode = EOF)
        }

        return (this.lastCode = this.text.charCodeAt(this.offset))
    }

    /**
     * Rescan the next state with the current code.
     */
    private back(): void {
        this.rescan = true
    }

    /**
     * Report an invalid character error.
     * @param code The error code.
     */
    private reportParseError(code: AST.ErrorCode): void {
        const error = AST.ParseError.fromCode(code, this.offset)
        this.errors.push(error)
    }

    /**
     * Get the char of current token.
     */
    private getCode(indexOffset = 0): number {
        return this.text.charCodeAt(this.nextTokenOffset + indexOffset)
    }

    /**
     * Commit the current token.
     */
    private commitToken(type: AST.TokenType, indexOffset = 0): void {
        const start = this.nextTokenOffset
        const offset = this.offset + indexOffset + 1
        const value = this.text.slice(start, offset)

        this.token = {
            type,
            value,
            source: {
                start: {
                    index: start,
                },
                end: {
                    index: offset,
                },
            },
        } as AST.Token
        this.nextTokenOffset = offset

        this.lastTokenType = type
    }

    /**
     * @param cc The current char code.
     * @returns The next state.
     */
    protected SCAN(cc: number): ScanState {
        if (isWhitespace(cc)) {
            return "WHITESPACE"
        }
        if (cc === DQUOTE) {
            return "DQUOTE"
        }
        if (cc === SQUOTE) {
            return "SQUOTE"
        }
        if (cc === SLASH) {
            return "SLASH"
        }
        if (cc === MINUS) {
            return "MINUS"
        }
        if (cc === PLUS) {
            return "PLUS"
        }
        if (cc === STAR) {
            this.commitToken("operator")
            return "SCAN"
        }
        if (isPunctuator(cc)) {
            this.commitToken("punctuator")
            return "SCAN"
        }
        if (cc === LBRACKET) {
            return "LBRACKET"
        }
        if (cc === LBRACE) {
            return "LBRACE"
        }
        if (cc === EOF) {
            return "SCAN"
        }
        return "WORD"
    }

    /* eslint-disable require-jsdoc, consistent-return */
    private WORD(cc: number): "MINUS" | void {
        while (
            !isWhitespace(cc) &&
            !isPunctuator(cc) &&
            cc !== PLUS &&
            cc !== STAR &&
            cc !== SLASH &&
            !isQuotes(cc) &&
            cc !== EOF
        ) {
            if (cc === MINUS) {
                const st = this.getCode()
                if (
                    maybeNumber(st) ||
                    ((st === MINUS || st === PLUS) &&
                        maybeNumber(this.getCode(1)))
                ) {
                    this.commitToken("word", -1)
                    return "MINUS"
                }
            } else if (cc === LBRACE || cc === LBRACKET || cc === LPAREN) {
                this.skipBrakets(this.next(), getRightBracket(cc))
            }
            cc = this.next()
        }
        this.commitToken("word", -1)
        this.back()
    }

    private LBRACKET(cc: number): "WORD" {
        this.skipBrakets(cc, RBRACKET)
        return "WORD"
    }

    private LBRACE(cc: number): "WORD" {
        this.skipBrakets(cc, RBRACE)
        return "WORD"
    }

    private WHITESPACE(cc: number): void {
        while (isWhitespace(cc)) {
            cc = this.next()
        }
        this.commitToken("whitespace", -1)
        this.back()
    }

    private SLASH(cc: number): "COMMENT" | "INLINE_COMMENT" | void {
        if (cc === STAR) {
            return "COMMENT"
        }
        if (cc === SLASH && this.options.allowInlineCommnets) {
            return "INLINE_COMMENT"
        }
        this.commitToken("operator", -1)
        this.back()
    }

    private COMMENT(cc: number): void {
        while (cc !== EOF) {
            if (cc === STAR) {
                cc = this.next()
                if (cc === SLASH) {
                    this.commitToken("comment")
                    return
                }
            }
            cc = this.next()
        }
        this.commitToken("comment", -1)
        this.reportParseError("eof-in-comment")
    }

    private INLINE_COMMENT(cc: number): void {
        while (cc !== EOF) {
            if (cc === LF || cc === FF) {
                this.commitToken("inline-comment")
                return
            }
            if (cc === CR) {
                cc = this.next()
                if (cc === LF) {
                    this.commitToken("inline-comment")
                    return
                }
                this.commitToken("inline-comment", -1)
                return this.back()
            }
            cc = this.next()
        }
        this.commitToken("inline-comment", -1)
    }

    private MINUS(cc: number): "WORD" | void {
        if (
            this.lastTokenType === "word" || // e.g. 10-
            cc === EOF ||
            (cc !== MINUS && !maybeNumber(cc) && !isLetter(cc))
        ) {
            this.commitToken("operator", -1)
            this.back()
            return
        }
        // signed num or var
        return "WORD"
    }

    private PLUS(cc: number): "WORD" | void {
        if (this.lastTokenType !== "word") {
            if (maybeNumber(cc)) {
                // signed num
                return "WORD"
            }
        }
        this.commitToken("operator", -1)
        this.back()
    }

    private DQUOTE(cc: number): void {
        this.skipString(cc, DQUOTE)
    }

    private SQUOTE(cc: number): void {
        this.skipString(cc, SQUOTE)
    }
    /* eslint-enable require-jsdoc, consistent-return */

    /**
     * Skip brackets
     */
    private skipBrakets(cc: number, end: RightBracketCode): void {
        const closeStack: RightBracketCode[] = []

        while (cc !== EOF) {
            if (end === cc) {
                const nextTargetBracket = closeStack.pop() || null
                if (!nextTargetBracket) {
                    return
                }
                end = nextTargetBracket
            } else if (cc === LBRACE || cc === LBRACKET || cc === LPAREN) {
                if (end) {
                    closeStack.push(end)
                }
                end = getRightBracket(cc)
            }
            cc = this.next()
        }
        this.reportParseError("eof-in-bracket")
    }

    /**
     * Skip string
     */
    private skipString(cc: number, end: number): void {
        while (cc !== EOF) {
            if (cc === BACKSLASH) {
                cc = this.next()
            } else if (cc === end) {
                this.commitToken("string")
                return
            }
            cc = this.next()
        }
        this.commitToken("string", -1)
        this.reportParseError("eof-in-string")
    }
}

/*eslint-enable no-param-reassign */
