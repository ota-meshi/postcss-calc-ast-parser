// @ts-check
"use strict"

const index = require("..")
const options = require("./options")

/**
 * @param {string} value value
 * @param {string} fileName fileName
 * @returns {index.AST.Root} tokens
 */
module.exports = (value, fileName) => {
    const root = index.parse(value, options(fileName))
    return root
}
