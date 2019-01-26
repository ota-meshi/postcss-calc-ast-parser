"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const fs = require("fs")
const path = require("path")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ROOT = path.join(__dirname, "../test/fixtures/ast")
// eslint-disable-next-line func-style
const testName = _test => ``
const testExt = `` // `scss`
const TESTS = [
    // add tests
]

function genFileName(base) {
    const targets = fs.readdirSync(ROOT)
    let seq = 1
    let name = base + `000${seq++}`.slice(-3)
    while (targets.includes(name)) {
        name = base + `000${seq++}`.slice(-3)
    }
    return name
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

for (const test of TESTS) {
    const ext = test.ext || testExt || "css"
    let css = test.input || test
    if (ext === "css" || ext === "scss" || ext === "less") {
        css = `a {
    width: ${css};
}`
    }
    const name = genFileName(
        test.name ||
            (typeof testName === "function" ? testName(test) : testName) ||
            "test"
    )
    fs.mkdirSync(path.join(ROOT, name))
    const sourceFileName = `source.${test.ext || ext}`
    const sourcePath = path.join(ROOT, `${name}/${sourceFileName}`)

    console.log("Create:", name)

    fs.writeFileSync(sourcePath, css)
}
