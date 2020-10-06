# scss-codemods

This project uses postcss to refactor 

## `union-class-name`

"Promotes" CSS classes that have the `&-` nesting union selector. Attempts to fix issues flagged by [scss/no-union-class-name](https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/selector-no-union-class-name/README.md) stylelint rule. 

Intended to improve "grepability" of the selectors that are produced in the browser.

### Usage

```bash
scss-codemods union-class-name --reorder no-reorder <files>
```

### Options

#### `--reorder`

Values:
- `no-reorder`: won't promote rules if it would result in the reordering of selectors
- `safe-reorder`: will promote rules that result in the reordering of selectors as long as the reordered selectors don't have the same specificity
- `unsafe-reorder`: will promote rules regardless of reordering, could result in differing styles if both classes are used on the same element and there's conflicting properties



