"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const fs = require("fs")
const path = require("path")
const findValues = require("../test/tools/find-values")
const tokenizer = require("../test/tools/tokenizer")
const parser = require("../test/tools/parser")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ROOT = path.join(__dirname, "../test/fixtures/ast")
const TARGETS = fs.readdirSync(ROOT)

/**
 * Remove proeprties from the given token.
 * @param {string} key The key.
 * @param {any} value The value of the key.
 * @returns {any} The value of the key to output.
 */
function tokenReplacer(key, value) {
    if (key === "source") {
        return undefined
    }
    return value
}

function astReplacer(key, value) {
    if (key === "errors" || key === "tokens") {
        return undefined
    }
    if (key === "parent") {
        return value && value.type
    }
    return value
}

function simpleAstReplacer(key, value) {
    if (
        key === "errors" ||
        key === "tokens" ||
        key === "parent" ||
        key === "source" ||
        key === "raws"
    ) {
        return undefined
    }
    return value
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

for (const name of TARGETS) {
    const sourceFileName = fs
        .readdirSync(path.join(ROOT, name))
        .find(f => f.startsWith("source."))
    const sourcePath = path.join(ROOT, `${name}/${sourceFileName}`)
    const tokensPath = path.join(ROOT, `${name}/tokens.json`)
    const errorsPath = path.join(ROOT, `${name}/errors.json`)
    const astPath = path.join(ROOT, `${name}/ast.json`)
    const simpleAstPath = path.join(ROOT, `${name}/ast-simple.json`)
    const source = fs.readFileSync(sourcePath, "utf8")

    console.log("Update:", name)

    const cssValues = findValues(source, sourceFileName)
    const tokens = cssValues.map(cssValue =>
        tokenizer(cssValue, sourceFileName)
    )
    const parsed = cssValues.map(cssValue => parser(cssValue, sourceFileName))
    const errors = parsed.map(p => ({
        errors: p.errors,
    }))

    fs.writeFileSync(tokensPath, JSON.stringify(tokens, tokenReplacer, 4))
    fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 4))
    fs.writeFileSync(astPath, JSON.stringify(parsed, astReplacer, 4))
    fs.writeFileSync(
        simpleAstPath,
        JSON.stringify(parsed, simpleAstReplacer, 4)
    )
}
