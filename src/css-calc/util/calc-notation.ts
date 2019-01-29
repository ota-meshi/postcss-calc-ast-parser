const RE_CALC = /^(-(webkit|mox)-)?calc/iu
const RE_MIN = /^(-(webkit|mox)-)?min/iu
const RE_MAX = /^(-(webkit|mox)-)?max/iu
const RE_CLAMP = /^(-(webkit|mox)-)?clamp/iu
/**
 * checks whether the given name is `calc()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isCalc(name: string): boolean {
    return RE_CALC.test(name)
}
/**
 * checks whether the given name is `min()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isMin(name: string): boolean {
    return RE_MIN.test(name)
}
/**
 * checks whether the given name is `max()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isMax(name: string): boolean {
    return RE_MAX.test(name)
}
/**
 * checks whether the given name is `clamp()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isClamp(name: string): boolean {
    return RE_CLAMP.test(name)
}

/**
 * checks whether the given name is math functions.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isMathFunction(name: string) {
    return isCalc(name) || isClamp(name) || isMin(name) || isMax(name)
}
