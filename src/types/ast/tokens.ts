import { HasLocation } from "./locations"

export interface IToken {
    type: string
    value: string
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

export interface WhitespaceToken extends IToken, HasLocation {
    type: "whitespace"
    value: string
}
export interface OperatorToken extends IToken, HasLocation {
    type: "operator"
    value: "+" | "-" | "*" | "/"
}
export interface CommentToken extends IToken, HasLocation {
    type: "comment"
    value: string
}
export interface PunctuatorToken extends IToken, HasLocation {
    type: "punctuator"
    value: "," | "(" | ")"
}
export interface WordToken extends IToken, HasLocation {
    type: "word"
    value: string
}
export interface StringToken extends IToken, HasLocation {
    type: "string"
    value: string
}
export interface InlineCommnetToken extends IToken, HasLocation {
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
