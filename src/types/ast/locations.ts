/**
 * Location object.
 */
export interface SourceLocation {
    start: {
        index: number
    }
    end: {
        index: number
    }
}

/**
 * This AST spec enhances the `Node` nodes.
 * The `source` property is an object which has locations.
 */
export interface HasLocation {
    source: SourceLocation
}
