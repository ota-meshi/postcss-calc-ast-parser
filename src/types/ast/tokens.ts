import { SourceLocation } from "./locations"

export interface IToken {
    type: string
    value: string
    source: SourceLocation
}
/**
 * Enumeration of token types.
 */
export type TokenType =
    | "whitespace"
    | "operator"
    | "comment"
    | "punctuator"
    | "word"
    | "string"
    // unstandard
    | "inline-comment"

export interface WhitespaceToken extends IToken {
    type: "whitespace"
    value: string
}
export interface OperatorToken extends IToken {
    type: "operator"
    value: "+" | "-" | "*" | "/"
}
export interface CommentToken extends IToken {
    type: "comment"
    value: string
}
export interface PunctuatorToken extends IToken {
    type: "punctuator"
    value: "," | "(" | ")"
}
export interface WordToken extends IToken {
    type: "word"
    value: string
}
export interface StringToken extends IToken {
    type: "string"
    value: string
}
export interface InlineCommnetToken extends IToken {
    type: "inline-comment"
    value: string
}
export type Token =
    | WhitespaceToken
    | OperatorToken
    | CommentToken
    | PunctuatorToken
    | WordToken
    | StringToken
    | InlineCommnetToken
