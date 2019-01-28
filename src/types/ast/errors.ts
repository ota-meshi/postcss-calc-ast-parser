/**
 * Parse errors.
 */
export class ParseError extends SyntaxError {
    public code?: ErrorCode
    public index: number

    /**
     * Create new parser error object.
     * @param code The error code.
     * @param offset The offset number of this error.
     */
    public static fromCode(code: ErrorCode, offset: number): ParseError {
        return new ParseError(MESSAGES[code], code, offset)
    }

    /**
     * Initialize this ParseError instance.
     * @param message The error message.
     * @param code The error code.
     * @param offset The offset number of this error.
     */
    public constructor(message: string, code: ErrorCode, offset: number) {
        super(message)
        this.code = code
        this.index = offset
    }
}

/**
 * The error codes of CSS syntax errors.
 */
export type ErrorCode =
    | "eof-in-string" // e.g `"string`, `'string`
    | "eof-in-comment" // e.g `/* comment`
    | "eof-in-bracket" // e.g `(expression`, `[expression`, `{expression`
    | "unexpected-parenthesis" // e.g `)`
    | "unexpected-calc-token"

const MESSAGES = {
    "eof-in-string": "Unclosed string",
    "eof-in-comment": "Unclosed comment",
    "eof-in-bracket": "Unclosed bracket",
    "unexpected-parenthesis": "Unexpected token",
    "unexpected-calc-token": "Unexpected token",
}
