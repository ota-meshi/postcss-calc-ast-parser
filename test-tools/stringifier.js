// @ts-check
"use strict"

const index = require("..")
/**
 * @param {index.AST.Node | index.AST.Token} node node
 * @returns {string} string
 */
module.exports = node => index.stringify(node)
