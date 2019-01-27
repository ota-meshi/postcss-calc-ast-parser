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
        input: "30px",
        output: {
            type: "Length",
            value: 30,
            unit: "px",
        },
    },
    {
        input: "30%",
        output: {
            type: "Percentage",
            value: 30,
            unit: "%",
        },
    },
    {
        input: "30em",
        output: {
            type: "Length",
            value: 30,
            unit: "em",
        },
    },
    {
        input: "calc(30% - 60px)",
        output: null,
    },
    {
        input: "calc(30em - 60px)",
        output: null, //
    },
    {
        input: "calc(30px - 20px)",
        output: {
            type: "Length",
            value: 30 - 20,
            unit: "px",
        },
    },
    {
        input: "calc(calc(270px - 60px) * 3)",
        output: {
            type: "Length",
            value: (270 - 60) * 3,
            unit: "px",
        },
    },
    {
        input: "calc(270px - 60px * 3)",
        output: {
            type: "Length",
            value: 270 - 60 * 3,
            unit: "px",
        },
    },
    {
        input: "calc(270px - (60px * 3))",
        output: {
            type: "Length",
            value: 270 - (60 * 3), // eslint-disable-line @mysticatea/prettier
            unit: "px",
        },
    },
    {
        input: "calc(200px - (60px * 3 + 2px * 4))",
        output: {
            type: "Length",
            value: 200 - (60 * 3 + 2 * 4),
            unit: "px",
        },
    },
    {
        input: "calc(400px - (60px * 3 * 2 / 2 * 2))",
        output: {
            type: "Length",
            value: 400 - (60 * 3 * 2 / 2 * 2), // eslint-disable-line @mysticatea/prettier
            unit: "px",
        },
    },
    {
        input: "calc(10px * (3 - 2 + 1))",
        output: {
            type: "Length",
            value: 20,
            unit: "px",
        },
    },
    {
        input: "calc((10px + 3s) * var(--foo-bar))",
        output: null,
    },
    {
        input: "calc(10px / 2px)",
        output: null,
    },
    {
        input: "calc(10 / 2 * 2px)",
        output: {
            type: "Length",
            value: 10,
            unit: "px",
        },
    },
    {
        input: "calc(10px * 2px)",
        output: null,
    },
    {
        input: "calc(10 * 2 * 2px)",
        output: {
            type: "Length",
            value: 40,
            unit: "px",
        },
    },
    {
        input: "calc(20px - 10px, 3px)",
        output: null,
    },
    {
        input: "calc(calc(10px - 20px) + 20px)",
        output: {
            type: "Length",
            value: 10,
            unit: "px",
        },
    },
]

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

describe("reducer", () => {
    for (const test of TESTS) {
        describe(test.input, () => {
            const parsed = index.parse(test.input)
            it("should be resolved type to expected.", () => {
                const actual = index.reduceMathExpression(parsed)
                const expected = test.output

                assert.deepStrictEqual(
                    actual && {
                        type: actual.type,
                        value: actual.value,
                        unit: actual.unit,
                    },
                    expected
                )
            })
        })
    }
})
