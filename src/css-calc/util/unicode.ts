export const EOF = -1
export const NULL = 0x00
export const TABULATION = 0x09
export const CARRIAGE_RETURN = 0x0d
export const LINE_FEED = 0x0a
export const FORM_FEED = 0x0c
export const SPACE = 0x20
export const QUOTATION_MARK = 0x22 // "
export const APOSTROPHE = 0x27 // '
export const LEFT_PARENTHESIS = 0x28 // (
export const RIGHT_PARENTHESIS = 0x29 // )
export const ASTERISK = 0x2a // *
export const PLUS_SIGN = 0x2b // +
export const COMMA = 0x2c // ,
export const HYPHEN_MINUS = 0x2d // -
export const FULL_STOP = 0x2e // .
export const SOLIDUS = 0x2f // /
export const DIGIT_0 = 0x30 // 0
export const DIGIT_9 = 0x39 // 9
export const LATIN_CAPITAL_A = 0x41 // A
export const LATIN_CAPITAL_Z = 0x5a // Z
export const LEFT_SQUARE_BRACKET = 0x5b // [
export const REVERSE_SOLIDUS = 0x5c // \
export const RIGHT_SQUARE_BRACKET = 0x5d // ]
export const LATIN_SMALL_A = 0x61 // a
export const LATIN_SMALL_Z = 0x7a // z
export const LEFT_CURLY_BRACKET = 0x7b // {
export const RIGHT_CURLY_BRACKET = 0x7d // }

/**
 * Check whether the char code is a whitespace.
 * @param cc The char code to check.
 * @returns `true` if the char code is a whitespace.
 */
export function isWhitespace(cc: number): boolean {
    return (
        cc === TABULATION ||
        cc === LINE_FEED ||
        cc === FORM_FEED ||
        cc === CARRIAGE_RETURN ||
        cc === SPACE
    )
}

/**
 * Check whether the char code is a digit character.
 * @param cc The char code to check.
 * @returns `true` if the char code is a digit character.
 */
export function isDigit(cc: number): boolean {
    return cc >= DIGIT_0 && cc <= DIGIT_9
}

/**
 * Check whether the char code is an uppercase letter character.
 * @param cc The char code to check.
 * @returns `true` if the char code is an uppercase letter character.
 */
export function isUpperLetter(cc: number): boolean {
    return cc >= LATIN_CAPITAL_A && cc <= LATIN_CAPITAL_Z
}

/**
 * Check whether the char code is a lowercase letter character.
 * @param cc The char code to check.
 * @returns `true` if the char code is a lowercase letter character.
 */
export function isLowerLetter(cc: number): boolean {
    return cc >= LATIN_SMALL_A && cc <= LATIN_SMALL_Z
}

/**
 * Check whether the char code is a letter character.
 * @param cc The char code to check.
 * @returns `true` if the char code is a letter character.
 */
export function isLetter(cc: number): boolean {
    return isLowerLetter(cc) || isUpperLetter(cc)
}
