# postcss-calc-ast-parser

Parses `calc()` of CSS, and converts it to AST.

## :cd: Installation

```bash
npm install --save-dev postcss-calc-ast-parser
```

## :book: Usage

```js
const calcAstParser = require("postcss-calc-ast-parser")

const parsed = calcAstParser.parse("calc(100%/3 - 2*1em - 2*1px)")
```

For example, parsing the value `calc(100%/3 - 2*1em - 2*1px)` will return the following:

```json
{
    "type": "Root",
    "nodes": [
        {
            "type": "Function",
            "name": "calc",
            "nodes": [
                {
                    "type": "MathExpression",
                    "left": {
                        "type": "MathExpression",
                        "left": {
                            "type": "Percentage",
                            "value": 100,
                            "unit": "%"
                        },
                        "operator": "/",
                        "right": {
                            "type": "Number",
                            "value": 3
                        }
                    },
                    "operator": "-",
                    "right": {
                        "type": "MathExpression",
                        "left": {
                            "type": "MathExpression",
                            "left": {
                                "type": "Number",
                                "value": 2
                            },
                            "operator": "*",
                            "right": {
                                "type": "Length",
                                "value": 1,
                                "unit": "em"
                            }
                        },
                        "operator": "-",
                        "right": {
                            "type": "MathExpression",
                            "left": {
                                "type": "Number",
                                "value": 2
                            },
                            "operator": "*",
                            "right": {
                                "type": "Length",
                                "value": 1,
                                "unit": "px"
                            }
                        }
                    }
                }
            ]
        }
    ]
}
```

To know more about certain nodes in produced AST, please go [AST docs](./docs/ast.md).

## API

```js
const calcAstParser = require("postcss-calc-ast-parser")

const parsed = calcAstParser.parse("calc(100% - 20px)")
```

### calcAstParser.parse(code: string, options?: Options): AST.Root

Parse the given source code.

### calcAstParser.stringify(node: AST.Node): string

Stringifies the given node.

### calcAstParser.getResolvedType(expr: AST.MathExpression): "Number" | "Length" | "Angle" | "Time" | "Frequency" | "Resolution" | "Percentage" | "Flex" | "Unknown" | "invalid"

Get the resolved type of the given math expression.
> https://drafts.csswg.org/css-values-3/#calc-type-checking

### parsed.walk(type: string | RegExp, callback: (node) => boolean | void): boolean | void

Walks each node of the given type inside parsed.nodes.


