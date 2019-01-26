/*eslint-disable no-param-reassign */
/**
 * checks whether the given name is `calc()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isCalc(name: string): boolean {
    name = name.toLowerCase()
    return name === "calc" || name === "-webkit-calc" || name === "-moz-calc"
}
/**
 * checks whether the given name is `min()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isMin(name: string): boolean {
    name = name.toLowerCase()
    return name === "min" || name === "-webkit-min" || name === "-moz-min"
}
/**
 * checks whether the given name is `max()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isMax(name: string): boolean {
    name = name.toLowerCase()
    return name === "max" || name === "-webkit-max" || name === "-moz-max"
}
/**
 * checks whether the given name is `clamp()`.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isClamp(name: string): boolean {
    name = name.toLowerCase()
    return name === "clamp" || name === "-webkit-clamp" || name === "-moz-clamp"
}
/*eslint-enable no-param-reassign */

/**
 * checks whether the given name is math functions.
 * @see https://www.w3.org/TR/css-values-4/#calc-notation
 */
export function isMathFunction(name: string) {
    return isCalc(name) || isClamp(name) || isMin(name) || isMax(name)
}
