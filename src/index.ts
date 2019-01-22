import * as AST from "./types/ast"
import { Parser, Tokenizer, Stringifier, getResolvedType } from "./css-calc"
import { Options, StringifyOptions } from "./types/options"

/**
 * Parse the given source code.
 * @param code The source code to parse.
 * @param options The parser options.
 * @returns The parsing result.
 */
export function parse(code: string, options?: Options): AST.Root {
    const tokenizer = new Tokenizer(code, options)
    return new Parser(tokenizer, options).parse()
}

/**
 * Stringify the given node.
 * @param node The node to string.
 * @param options The stringify options.
 * @returns The string result.
 */
export function stringify(
    node:
        | AST.Node // nodes
        | AST.Token, // tokens
    options?: StringifyOptions,
): string {
    const stringifier = new Stringifier(options)
    return stringifier.stringify(node)
}

export { getResolvedType, Parser, Tokenizer, Stringifier, AST }
