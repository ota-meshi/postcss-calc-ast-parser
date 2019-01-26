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
    // minus
    {
        input: "10 - 20",
        output: "Number",
    },
    {
        input: "10px - 20px",
        output: "Length",
    },
    {
        input: "10px - 20%",
        output: "Length",
    },
    {
        input: "10% - 20px",
        output: "Length",
    },
    // invalid
    {
        input: "10px - 20",
        output: "invalid",
    },
    {
        input: "10 - 20px",
        output: "invalid",
    },
    {
        input: "10Hz - 20px",
        output: "invalid",
    },
    // unknown
    {
        input: "10unknown - 20px",
        output: "Unknown",
    },
    {
        input: "10px - var(--foo-bar)",
        output: "Unknown",
    },

    // plus
    {
        input: "10 + 20",
        output: "Number",
    },
    {
        input: "10px + 20px",
        output: "Length",
    },
    {
        input: "10px + 20%",
        output: "Length",
    },
    {
        input: "10% + 20px",
        output: "Length",
    },
    // invalid
    {
        input: "10px + 20",
        output: "invalid",
    },
    {
        input: "10 + 20px",
        output: "invalid",
    },
    {
        input: "10Hz + 20px",
        output: "invalid",
    },
    // unknown
    {
        input: "10unknown + 20px",
        output: "Unknown",
    },
    {
        input: "10px + var(--foo-bar)",
        output: "Unknown",
    },

    // multiple
    {
        input: "10 * 20",
        output: "Number",
    },
    {
        input: "10px * 20",
        output: "Length",
    },
    {
        input: "10 * 20px",
        output: "Length",
    },
    // invalid
    {
        input: "10px * 20px",
        output: "invalid",
    },
    // unknown
    {
        input: "10unknown * 20px",
        output: "Unknown",
    },
    {
        input: "10px * var(--foo-bar)",
        output: "Unknown",
    },

    // divide
    {
        input: "10 / 20",
        output: "Number",
    },
    {
        input: "10px / 20",
        output: "Length",
    },
    // invalid
    {
        input: "10 / 20px",
        output: "invalid",
    },
    {
        input: "10px / 20px",
        output: "invalid",
    },
    {
        input: "10unknown / 20px",
        output: "invalid",
    },
    // unknown
    {
        input: "10px / var(--foo-bar)",
        output: "Unknown",
    },

    // nesting
    {
        input: "10px - (5% * 4)",
        output: "Length",
    },
    {
        input: "10px - calc(5% * 4)",
        output: "Length",
    },
    // unknown
    {
        input: "10px - (5% * 4, 7)",
        output: "Unknown",
    },
    {
        input: "10px - calc(5% * 4, 7)",
        output: "Unknown",
    },

    // min max
    {
        input: "10px - min(5% * 4, 5%, 10 * 6px, max(40px, 30vm))",
        output: "Length",
    },
    {
        input: "10px - min(5px * 4, 5%, 10 * 6%)",
        output: "Length",
    },
    // unknown
    {
        input: "10px - min(5% * 4, 5%, 10 * 6px, )",
        output: "Unknown",
    },
    {
        input: "10px - min(5% * 4, 5%, 10 * 6px, 40s)",
        output: "Unknown",
    },
    {
        input: "10px - min()",
        output: "Unknown",
    },

    // clamp
    {
        input: "10px - clamp(5% * 4, 5%, 10 * 6px)",
        output: "Length",
    },
    // unknown
    {
        input: "10px - clamp(5% * 4, 5%)",
        output: "Unknown",
    },
    {
        input: "10px - clamp(5% * 4, 5px, 10 * 6s)",
        output: "Unknown",
    },
]

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

describe("resolved-type", () => {
    for (const test of TESTS) {
        describe(test.input, () => {
            const parsed = index.parse(test.input)
            it("should be resolved type to expected.", () => {
                const actual = index.getResolvedType(parsed.nodes[0])
                const expected = test.output

                assert.strictEqual(actual, expected)
            })
        })
    }
})
