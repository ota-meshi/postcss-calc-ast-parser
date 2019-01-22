"use strict"

const options = require("./options")
const index = require("../../dist/index")
const { Tokenizer } = index
module.exports = (value, fileName) => {
    const tokenizer = new Tokenizer(value, options(fileName))
    const tokens = []
    let token = undefined
    while ((token = tokenizer.nextToken())) {
        tokens.push(token)
    }
    return {
        tokens,
    }
}
