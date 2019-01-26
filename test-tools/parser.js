"use strict"

const index = require("..")
const options = require("./options")

module.exports = (value, fileName) => {
    const root = index.parse(value, options(fileName))
    return root
}
