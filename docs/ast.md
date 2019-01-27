# AST for CSS `calc()`

You can use the type definition of this AST:

```ts
import { AST } from "postcss-calc-ast-parser"
```

See details: [../src/types/ast/nodes.ts](../src/types/ast/nodes.ts)

## Node

```ts
export interface INode {
    source: {
        start: {
            index: number
        }
        end: {
            index: number
        }
    }
}
```

- The `source` property is an object which has locations.

## Expressions

```ts
/**
 * Expression
 */
export type Expression =
    | NumberValue
    | LengthValue
    | AngleValue
    | TimeValue
    | FrequencyValue
    | ResolutionValue
    | PercentageValue
    | FlexValue
    | Word
    | MathExpression
    | FunctionNode
    | Parentheses
    | StringNode
```

### Number

```ts
/**
 * Number value
 * @see https://www.w3.org/TR/css3-values/#integers
 * @see https://www.w3.org/TR/css3-values/#numbers
 */
export interface NumberValue extends INode {
    type: "Number"
    value: number
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
    }
}
```

- `Number` is node of real numbers or integers.  
    https://www.w3.org/TR/css3-values/#integers  
    https://www.w3.org/TR/css3-values/#numbers  
- Examples :  
  - `-10` :  
    ```json
    {
        "type": "Number",
        "value": -10,
        "raws": {
            "before": "",
            "value": {
                "raw": "-10",
                "value": -10
            }
        }
    }
    ```
  - `/*comment*/ +.01` :  
    ```json
    {
        "type": "Number",
        "value": 0.01,
        "raws": {
            "before": "/*comment*/ ",
            "value": {
                "raw": "+.01",
                "value": 0.01
            }
        }
    }
    ```

### Length

```ts
/**
 * Length value
 * @see https://www.w3.org/TR/css3-values/#lengths
 */
export interface LengthValue extends INode {
    type: "Length"
    value: number
    unit: "em" | "ex" | "ch" | "rem" | "vw" | "vh" | "vmin" | "vmax" | "px" | "mm" | "cm" | "in" | "pt" | "pc" | "Q" | "vm"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"em"`, `"ex"`, `"ch"`, `"rem"`, `"vw"`, `"vh"`, `"vmin"`, `"vmax"`,
         * `"px"`, `"mm"`, `"cm"`, `"in"`, `"pt"`, `"pc"`, `"Q"` or `"vm"` (non-standard name)
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Length` is node of numbers with distance units.  
    https://www.w3.org/TR/css3-values/#lengths  
- Examples :  
  - `-10px` :  
    ```json
    {
        "type": "Length",
        "value": -10,
        "unit": "px",
        "raws": {
            "before": "",
            "value": { ... }
        }
    }
    ```
  - `-10PX` :  
    ```json
    {
        "type": "Length",
        "value": -10,
        "unit": "px",
        "raws": {
            "before": "",
            "value": { ... },
            "unit": {
                "raw": "PX"
                "value": "px"
            }
        }
    }
    ```

### Angle

```ts
/**
 * Angle value
 * @see https://www.w3.org/TR/css3-values/#angles
 */
export interface AngleValue extends INode {
    type: "Angle"
    value: number
    unit: "deg" | "grad" | "turn" | "rad"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"deg"`, `"grad"`, `"turn"` or `"rad"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Angle` is node of numbers with angle units.  
    https://www.w3.org/TR/css3-values/#angles  

### Time

```ts
/**
 * Time value
 * @see https://www.w3.org/TR/css3-values/#time
 */
export interface TimeValue extends INode {
    type: "Time"
    value: number
    unit: "s" | "ms"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"s"` or `"ms"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Time` is node of numbers with duration units.  
    https://www.w3.org/TR/css3-values/#time  

### Frequency

```ts
/**
 * Frequency value
 * @see https://www.w3.org/TR/css3-values/#frequency
 */
export interface FrequencyValue extends INode {
    type: "Frequency"
    value: number
    unit: "Hz" | "kHz"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"Hz"` or `"kHz"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Frequency` is node of numbers with frequency units.  
    https://www.w3.org/TR/css3-values/#frequency  

### Resolution

```ts
/**
 * Resolution value
 * @see https://www.w3.org/TR/css3-values/#resolution
 */
export interface ResolutionValue extends INode {
    type: "Resolution"
    value: number
    unit: "dpi" | "dpcm" | "dppm"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"dpi"`, `"dpcm"` or `"dppm"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Resolution` is node of numbers with resolution units.  
    https://www.w3.org/TR/css3-values/#resolution  

### Percentage

```ts
/**
 * Percentage value
 * @see https://www.w3.org/TR/css3-values/#percentages
 */
export interface PercentageValue extends INode {
    type: "Percentage"
    value: number
    unit: "%"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Percentage` is node of numbers with percentages units.  
    https://www.w3.org/TR/css3-values/#percentages  

### Flex

```ts
/**
 * Flex value
 * @see https://www.w3.org/TR/css-grid-1/#fr-unit
 */
export interface FlexValue extends INode {
    type: "Flex"
    value: number
    unit: "fr"
    raws: {
        before: string
        value: {
            raw: string
            value: number
        }
        /**
         * Case insensitive value of `"fr"`
         */
        unit?: {
            raw: string
            value: string
        }
    }
}
```

- `Flex` is node of numbers of the flexible lengths.  
    https://www.w3.org/TR/css-grid-1/#fr-unit  

### Word

```ts
/**
 * Unknown value or word
 */
export interface Word extends INode {
    type: "Word"
    value: string
    raws: {
        before: string
    }
}
```

- `Word` is node of words or unknown values.  
- Examples :  
  - `foo` :  
    ```json
    {
        "type": "Word",
        "value": "foo",
        "raws": { ... }
    }
    ```
  - `-10foo` :  
    ```json
    {
        "type": "Word",
        "value": "-10foo",
        "raws": { ... }
    }
    ```
  - `#{ foo-bar }` :  
    ```json
    {
        "type": "Word",
        "value": "#{ foo-bar }",
        "raws": { ... }
    }
    ```

### MathExpression

```ts
/**
 * Math expression
 */
export interface MathExpression extends INode {
    type: "MathExpression"
    left: Expression
    operator: "+" | "-" | "*" | "/"
    right: Expression
    raws: {
        before: string
        /**
         * the symbols between the left and operator.
         */
        between: string
    }
    source?: {
        start: { index: number }
        operator: { start: { index: number }, end: { index: number } }
        end: { index: number }
    }
}
```

- `MathExpression` is node of the mathematical expression with a right side and a left side.  
- Examples :  
  - `100% - 20px` :  
    ```json
    {
        "type": "MathExpression",
        "left": { "type": "Percentage", "value": 100, "unit": "%", ... },
        "operator": "+",
        "right": { "type": "Length", "value": 20, ... },
        "raws": { "between": " ", ... }
    }
    ```
  - `/* a */ 100% /* b */ - /* c */ 20px` :  
    ```json
    {
        "type": "MathExpression",
        "left": { ... , "raws": { "before": "/* a */ " } },
        "operator": "+",
        "right": { ... , "raws": { "before": "/* c */ " } },
        "raws": { "between": " /* b */ ", ... }
    }
    ```

### Function

```ts
/**
 * Function
 */
export interface FunctionNode extends IContainer {
    type: "Function"
    name: string
    nodes: (Expression, Other)[]
    raws: {
        before: string
        beforeClose?: string
    }
    unclosed?: boolean
}
```

- `Function` is node of the function call expression.  
- Examples :  
  - `call(100% - 20px)` :  
    ```json
    {
        "type": "Function",
        "name": "call",
        "nodes": [ { "type": "MathExpression", ... } ],
        "raws": { ... }
    }
    ```
  - `var(--foo-bar)` :  
    ```json
    {
        "type": "Function",
        "name": "var",
        "nodes": [ { "type": "Word", "value": "--foo-bar" } ],
        "raws": { ... }
    }
    ```
  - `/*a*/ var( /*b*/ --foo-bar /*c*/ , /*d*/ 10px /*e*/ )` :  
    ```json
    {
        "type": "Function",
        "name": "var",
        "nodes": [
            { "type": "Word", "value": "--foo-bar", "raws": { "before": " /*b*/ " } },
            { "type": "Punctuator", "value": ",", "raws": { "before": " /*c*/ " } },
            { "type": "Length", "value": "10", ... , "raws": { "before": " /*d*/ ", ... } },
        ],
        "raws": {
            "before": "/*a*/ ",
            "beforeClose": " /*e*/ "
        }
    }
    ```

### Parentheses

```ts
/**
 * Parentheses
 */
export interface Parentheses extends IContainer {
    type: "Parentheses"
    nodes: (Expression, Other)[]
    raws: {
        before: string
        beforeClose?: string
    }
    unclosed?: boolean
}
```

- `Parentheses` is node of the expression enclosed in parentheses.  

### String

```ts
/**
 * String
 */
export interface StringNode extends INode {
    type: "String"
    value: string
    raws: {
        before: string
    }
}
```

- `String` is node of the string.  
- Examples :  
  - `'str'` :  
    ```json
    {
        "type": "String",
        "value": "'str'",
        ...
    }
    ```
  - `"str"` :  
    ```json
    {
        "type": "String",
        "value": "\"str\"",
        ...
    }
    ```

## Root

```ts
/**
 * Root
 */
export interface Root extends INode {
    type: "Root"
    nodes: (Expression, Other)[]
    tokens: Token[]
    errors: ParseError[]
    raws: { after: string }
}

interface Token {
    type: string
    value: string
}

interface ParseError extends Error {
    code?: string
    message: string
    index: number
}
```

## Others

```ts
export type Other = Operator | Punctuator
```

### Punctuator

```ts
/**
 * Punctuator
 */
export interface Punctuator extends INode {
    type: "Punctuator"
    value: "," | "(" | ")"
    raws: {
        before: string
    }
}
```

- `Punctuator` is node of the punctuator.
- `(`, `)` that could not be processed are retained as `Punctuator` nodes.

### Operator

```ts
/**
 * Operator
 */
export interface Operator extends INode {
    type: "Operator"
    value: "+" | "-" | "*" | "/"
    raws: {
        before: string
    }
}
```

- `Operator` is node of the operator.  
- Operators that could not be processed are retained as `Operator` nodes.