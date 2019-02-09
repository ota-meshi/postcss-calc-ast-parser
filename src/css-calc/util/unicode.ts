export const EOF = -1
export const NULL = 0x00
export const TAB = 0x09
export const CR = 0x0d
export const LF = 0x0a
export const FF = 0x0c
export const SPACE = 0x20
export const DQUOTE = 0x22 // "
export const SQUOTE = 0x27 // '
export const LPAREN = 0x28 // (
export const RPAREN = 0x29 // )
export const STAR = 0x2a // *
export const PLUS = 0x2b // +
export const COMMA = 0x2c // ,
export const MINUS = 0x2d // -
export const DOT = 0x2e // .
export const SLASH = 0x2f // /
export const LBRACKET = 0x5b // [
export const BACKSLASH = 0x5c // \
export const RBRACKET = 0x5d // ]
export const LBRACE = 0x7b // {
export const RBRACE = 0x7d // }

/**
 * Check whether the char code is a whitespace.
 * @param cc The char code to check.
 * @returns `true` if the char code is a whitespace.
 */
export function isWhitespace(
    cc: number,
): cc is 0x09 | 0x0a | 0x0c | 0x0d | 0x20 {
    return cc === TAB || cc === LF || cc === FF || cc === CR || cc === SPACE
}

/**
 * Check whether the char code is a digit character.
 * @param cc The char code to check.
 * @returns `true` if the char code is a digit character.
 */
export function isDigit(
    cc: number,
): cc is 0x30 | 0x31 | 0x32 | 0x33 | 0x34 | 0x35 | 0x36 | 0x37 | 0x38 | 0x39 {
    return cc >= 0x30 /* 0 */ && cc <= 0x39 /* 9 */
}

/**
 * Check whether the char code is a letter character.
 * @param cc The char code to check.
 * @returns `true` if the char code is a letter character.
 */
export function isLetter(cc: number): boolean {
    return (
        (cc >= /* a */ 0x61 && cc <= /* z */ 0x7a) ||
        (cc >= /* A */ 0x41 && cc <= /* Z */ 0x5a)
    )
}
