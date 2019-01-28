// @ts-check
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("assert")
const fs = require("fs")
const path = require("path")
const findValues = require("../test-tools/find-values")
const tokenizer = require("../test-tools/tokenizer")
const parser = require("../test-tools/parser")
const stringifier = require("../test-tools/stringifier")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ROOT = path.join(__dirname, "fixtures/ast")
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

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

describe("AST", () => {
    for (const name of TARGETS) {
        const sourceFileName = fs
            .readdirSync(path.join(ROOT, name))
            .find(f => f.startsWith("source."))
        const sourcePath = path.join(ROOT, `${name}/${sourceFileName}`)
        const source = fs.readFileSync(sourcePath, "utf8")
        const cssValues = findValues(source, sourceFileName)

        describe(`'test/fixtures/ast/${name}/${sourceFileName}'`, () => {
            describe("tokens", () => {
                const tokens = cssValues.map(cssValue =>
                    tokenizer(cssValue, sourceFileName)
                )
                it("should be parsed to valid tokens.", () => {
                    const tokensPath = path.join(ROOT, `${name}/tokens.json`)
                    const expected = fs.readFileSync(tokensPath, "utf8")

                    assert.strictEqual(
                        JSON.stringify(tokens, tokenReplacer, 4),
                        expected
                    )
                })
                it("should be parsed to valid token.source.", () => {
                    tokens.forEach((parsed, i) => {
                        let start = 0
                        for (const token of parsed.tokens) {
                            assert.strictEqual(
                                start,
                                token.source.start.index,
                                token.value
                            )
                            start = token.source.end.index
                        }
                        assert.strictEqual(
                            cssValues[i].length,
                            start,
                            "token.end"
                        )
                    })
                })
                it("should be parsed to valid token.value.", () => {
                    tokens.forEach((parsed, i) => {
                        assert.strictEqual(
                            cssValues[i],
                            parsed.tokens.map(t => t.value).join("")
                        )
                    })
                })
                it("should be parsed to valid token.value. 2", () => {
                    tokens.forEach((parsed, i) => {
                        assert.strictEqual(
                            cssValues[i],
                            parsed.tokens.map(stringifier).join("")
                        )
                    })
                })
            })
            describe("ast", () => {
                const parsed = cssValues.map(cssValue =>
                    parser(cssValue, sourceFileName)
                )

                it("should be parsed to valid ast.", () => {
                    const astPath = path.join(ROOT, `${name}/ast.json`)
                    const expected = fs.readFileSync(astPath, "utf8")

                    assert.strictEqual(
                        JSON.stringify(parsed, astReplacer, 4),
                        expected
                    )
                })

                it("should be parsed to valid ast.source", () => {
                    parsed.forEach((ast, i) => {
                        check(ast, cssValues[i])
                        ast.walk(/.*/u, node => {
                            check(node, cssValues[i])
                        })
                    })

                    function check(node, cssValue) {
                        const expected = cssValue.slice(
                            node.source.start.index -
                                (node.raws.before || "").length,
                            node.source.end.index +
                                (node.raws.after || "").length
                        )
                        assert.strictEqual(
                            stringifier(node),
                            expected,
                            node.type
                        )
                        assert.strictEqual(`${node}`, expected, node.type)
                    }
                })
                it("should be parsed to valid errors.", () => {
                    const errors = parsed.map(p => ({
                        errors: p.errors,
                    }))
                    const errorsPath = path.join(ROOT, `${name}/errors.json`)
                    const expected = fs.readFileSync(errorsPath, "utf8")

                    assert.strictEqual(
                        JSON.stringify(errors, null, 4),
                        expected
                    )
                })
                it("should be parsed to valid tokens.", () => {
                    const tokens = parsed.map(p => ({ tokens: p.tokens }))
                    const tokensPath = path.join(ROOT, `${name}/tokens.json`)
                    const expected = fs.readFileSync(tokensPath, "utf8")

                    assert.strictEqual(
                        JSON.stringify(tokens, tokenReplacer, 4),
                        expected
                    )
                })
            })
        })
    }
})
