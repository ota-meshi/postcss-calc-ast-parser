"use strict"

const path = require("path")
const postcss = require("postcss")
const scss = require("postcss-scss")
module.exports = (css, fileName) => {
    const ext = path.extname(fileName)
    if (ext === ".txt") {
        return [css]
    }
    const root = ext === ".scss" ? scss.parse(css) : postcss.parse(css)

    const results = []
    root.walkDecls(decl => {
        let value = decl.value
        if (decl.raws.value) {
            value =
                (ext === ".scss" && decl.raws.value.scss) || decl.raws.value.raw
        }
        results.push(value)
    })
    return results
}
