/*eslint-disable no-param-reassign */
import * as AST from "../types/ast"
import {
    isWhitespace,
    isDigit,
    APOSTROPHE,
    EOF,
    HYPHEN_MINUS,
    LEFT_CURLY_BRACKET,
    LEFT_SQUARE_BRACKET,
    NULL,
    QUOTATION_MARK,
    RIGHT_CURLY_BRACKET,
    RIGHT_SQUARE_BRACKET,
    SOLIDUS,
    REVERSE_SOLIDUS,
    CARRIAGE_RETURN,
    LINE_FEED,
    FORM_FEED,
    PLUS_SIGN,
    ASTERISK,
    LEFT_PARENTHESIS,
    RIGHT_PARENTHESIS,
    COMMA,
    FULL_STOP,
    isLetter,
} from "./util/unicode"
import { Options } from "../types/options"

/**
 * Enumeration of sacan state types.
 */
type ScanState =
    | "SCAN"
    | "WORD"
    | "WHITESPACE"
    | "HYPHEN" // `-`
    | "PLUS" // `+`
    | "SLASH" // `/`
    | "COMMENT" // `/*`
    | "SQUOTE" // `'`
    | "DQUOTE" // `"`
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
    return cc === LEFT_PARENTHESIS || cc === RIGHT_PARENTHESIS || cc === COMMA
}

/**
 * checks whether the given char is maybe number.
 * @param cc char
 * @returns `true` if the given char is maybe number.
 */
function maybeNumber(cc: number): boolean {
    return isDigit(cc) || cc === FULL_STOP
}

/**
 * checks whether the given char is quotes.
 * @param cc char
 * @returns `true` if the given char quotes
 */
function isQuotes(cc: number): boolean {
    return cc === QUOTATION_MARK || cc === APOSTROPHE
}

type LeftBracketCode =
    | typeof LEFT_PARENTHESIS
    | typeof LEFT_SQUARE_BRACKET
    | typeof LEFT_CURLY_BRACKET
type RightBracketCode =
    | typeof RIGHT_PARENTHESIS
    | typeof RIGHT_SQUARE_BRACKET
    | typeof RIGHT_CURLY_BRACKET

/**
 * Gets the right bracket from the given char.
 * @param cc char
 * @returns the right bracket
 */
function getRightBracket(cc: LeftBracketCode): RightBracketCode {
    if (cc === LEFT_PARENTHESIS) {
        return RIGHT_PARENTHESIS
    }
    if (cc === LEFT_CURLY_BRACKET) {
        return RIGHT_CURLY_BRACKET
    }
    return RIGHT_SQUARE_BRACKET
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
            this.state = this[this.state](cc)
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
     * Rescan the `"SCAN"` state with the current code.
     * @returns The `"SCAN"` state.
     */
    private back(): "SCAN" {
        this.rescan = true
        return "SCAN"
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
        // const type = this.currentTokenType
        if (type == null) {
            throw new Error("Invalid state")
        }
        const start = this.nextTokenOffset
        const offset = this.offset + indexOffset + 1
        const value = this.text.slice(start, offset)
        const token = {
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
        }

        this.token = token as AST.Token
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
        if (cc === QUOTATION_MARK) {
            return "DQUOTE"
        }
        if (cc === APOSTROPHE) {
            return "SQUOTE"
        }
        if (cc === SOLIDUS) {
            return "SLASH"
        }
        if (cc === HYPHEN_MINUS) {
            return "HYPHEN"
        }
        if (cc === PLUS_SIGN) {
            return "PLUS"
        }
        if (cc === ASTERISK) {
            this.commitToken("operator")
            return "SCAN"
        }
        if (isPunctuator(cc)) {
            this.commitToken("punctuator")
            return "SCAN"
        }
        if (cc === LEFT_CURLY_BRACKET) {
            return "LBRACKET"
        }
        if (cc === LEFT_SQUARE_BRACKET) {
            return "LBRACE"
        }
        if (cc === EOF) {
            return "SCAN"
        }
        return "WORD"
    }

    /* eslint-disable require-jsdoc */
    private WORD(cc: number): "HYPHEN" | "SCAN" {
        while (
            !isWhitespace(cc) &&
            !isPunctuator(cc) &&
            cc !== PLUS_SIGN &&
            cc !== ASTERISK &&
            cc !== SOLIDUS &&
            !isQuotes(cc) &&
            cc !== EOF
        ) {
            if (cc === HYPHEN_MINUS) {
                const st = this.getCode()
                if (
                    maybeNumber(st) ||
                    ((st === HYPHEN_MINUS || st === PLUS_SIGN) &&
                        maybeNumber(this.getCode(1)))
                ) {
                    this.commitToken("word", -1)
                    return "HYPHEN"
                }
            } else if (
                cc === LEFT_CURLY_BRACKET ||
                cc === LEFT_SQUARE_BRACKET ||
                cc === LEFT_PARENTHESIS
            ) {
                this.skipBrakets(this.next(), getRightBracket(cc))
            }
            cc = this.next()
        }
        this.commitToken("word", -1)
        return this.back()
    }

    private LBRACKET(cc: number): "WORD" {
        this.skipBrakets(cc, RIGHT_CURLY_BRACKET)
        return "WORD"
    }

    private LBRACE(cc: number): "WORD" {
        this.skipBrakets(cc, RIGHT_SQUARE_BRACKET)
        return "WORD"
    }

    private WHITESPACE(cc: number): "SCAN" {
        while (isWhitespace(cc)) {
            cc = this.next()
        }
        this.commitToken("whitespace", -1)
        return this.back()
    }

    private SLASH(cc: number): "COMMENT" | "INLINE_COMMENT" | "SCAN" {
        if (cc === ASTERISK) {
            return "COMMENT"
        }
        if (cc === SOLIDUS && this.options.allowInlineCommnets) {
            return "INLINE_COMMENT"
        }
        this.commitToken("operator", -1)
        return this.back()
    }

    private COMMENT(cc: number): "SCAN" {
        while (cc !== EOF) {
            if (cc === ASTERISK) {
                cc = this.next()
                if (cc === SOLIDUS) {
                    this.commitToken("comment")
                    return "SCAN"
                }
            }
            cc = this.next()
        }
        this.commitToken("comment", -1)
        this.reportParseError("eof-in-comment")
        return "SCAN"
    }

    private INLINE_COMMENT(cc: number): "SCAN" {
        while (cc !== EOF) {
            if (cc === LINE_FEED || cc === FORM_FEED) {
                this.commitToken("inline-comment")
                return "SCAN"
            }
            if (cc === CARRIAGE_RETURN) {
                cc = this.next()
                if (cc === LINE_FEED) {
                    this.commitToken("inline-comment")
                    return "SCAN"
                }
                this.commitToken("inline-comment", -1)
                return this.back()
            }
            cc = this.next()
        }
        this.commitToken("inline-comment", -1)
        return "SCAN"
    }

    private HYPHEN(cc: number): "SCAN" | "WORD" {
        if (
            this.lastTokenType === "word" || // e.g. 10-
            cc === EOF ||
            (cc !== HYPHEN_MINUS && !maybeNumber(cc) && !isLetter(cc))
        ) {
            this.commitToken("operator", -1)
            return this.back()
        }
        // signed num or var
        return "WORD"
    }

    private PLUS(cc: number): "SCAN" | "WORD" {
        if (this.lastTokenType !== "word") {
            if (maybeNumber(cc)) {
                // signed num
                return "WORD"
            }
        }
        this.commitToken("operator", -1)
        return this.back()
    }

    private DQUOTE(cc: number): "SCAN" {
        this.skipString(cc, QUOTATION_MARK)
        return "SCAN"
    }

    private SQUOTE(cc: number): "SCAN" {
        this.skipString(cc, APOSTROPHE)
        return "SCAN"
    }
    /* eslint-enable require-jsdoc */

    /**
     * Skip brackets
     */
    private skipBrakets(cc: number, end: RightBracketCode): number {
        const targetBracketsStack: RightBracketCode[] = []

        while (cc !== EOF) {
            if (end === cc) {
                const nextTargetBracket = targetBracketsStack.pop() || null
                if (!nextTargetBracket) {
                    return cc
                }
                end = nextTargetBracket
            } else if (
                cc === LEFT_CURLY_BRACKET ||
                cc === LEFT_SQUARE_BRACKET ||
                cc === LEFT_PARENTHESIS
            ) {
                if (end) {
                    targetBracketsStack.push(end)
                }
                end = getRightBracket(cc)
            }
            cc = this.next()
        }
        this.reportParseError("eof-in-bracket")
        return cc
    }

    /**
     * Skip string
     */
    private skipString(cc: number, end: number): number {
        while (cc !== EOF) {
            if (cc === REVERSE_SOLIDUS) {
                cc = this.next()
            } else if (cc === end) {
                this.commitToken("string")
                return cc
            }
            cc = this.next()
        }
        this.commitToken("string", -1)
        this.reportParseError("eof-in-string")
        return cc
    }
}

/*eslint-enable no-param-reassign */
