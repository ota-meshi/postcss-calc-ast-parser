"use strict"

const path = require("path")
module.exports = fileName => {
    let options = undefined
    let ext = path.extname(fileName)
    if (ext === ".txt") {
        ext = path.extname(fileName.slice(0, -ext.length)) || ext
    }
    if (ext === ".scss" || ext === ".less") {
        options = { allowInlineCommnets: true }
    }
    return options
}
