// @ts-check
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("assert")
const index = require("../../")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const TESTS = [
    {
        input() {
            return index.mathExpr(index.parse("1"), "+", index.parse("2"))
        },
        output: "1 + 2",
    },
    {
        input() {
            const e = index.mathExpr(index.parse("1"), "+", index.parse("2"))
            delete e.raws.between
            return e
        },
        output: "1 + 2",
    },
    {
        input() {
            return index.mathExpr(index.parse("1"), "+", index.parse("2 + 3"))
        },
        output: "1 + 2 + 3",
    },
    {
        input() {
            return index.mathExpr(
                index.parse("1 + 2"),
                "*",
                index.parse("3 + 4")
            )
        },
        output: "(1 + 2) * (3 + 4)",
    },
    {
        input() {
            return index.mathExpr(
                index.parse("1 - 2"),
                "*",
                index.parse("3 - 4")
            )
        },
        output: "(1 - 2) * (3 - 4)",
    },
    {
        input() {
            return index.mathExpr(
                index.parse("1 + 2"),
                "+",
                index.parse("3 - 4")
            )
        },
        output: "1 + 2 + (3 - 4)",
    },
]

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

describe("resolved-type", () => {
    for (const test of TESTS) {
        const input = test.input()
        describe(input.toString(), () => {
            const stringifier = new index.Stringifier({ autofix: true })
            it("should be string to expected.", () => {
                const actual = stringifier.stringify(input)
                const expected = test.output

                assert.strictEqual(actual, expected)
            })
        })
    }
})
