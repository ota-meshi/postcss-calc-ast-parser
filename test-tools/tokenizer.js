// @ts-check
"use strict"

const options = require("./options")
const index = require("..")
const { Tokenizer } = index
/**
 * @param {string} value value
 * @param {string} fileName fileName
 * @returns {{ tokens: index.AST.Token[] }} tokens
 */
module.exports = (value, fileName) => {
    const tokenizer = new Tokenizer(value, options(fileName))
    /**
     * @type {index.AST.Token[]}
     */
    const tokens = []
    let token = undefined
    while ((token = tokenizer.nextToken())) {
        tokens.push(token)
    }
    return {
        tokens,
    }
}
