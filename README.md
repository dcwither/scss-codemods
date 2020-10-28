# scss-codemods

This project uses postcss to refactor scss code to conform to lint rules that are intended to improve grepability/readability.

## Installation

### Globally via `npm`

```sh
npm i -g scss-codemods
```

### Running on-demand

```
npx scss-codemods [command] [options]
```

## `union-class-name`

"Promotes" CSS classes that have the `&-` nesting union selector. Attempts to fix issues flagged by [scss/no-union-class-name](https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/selector-no-union-class-name/README.md) stylelint rule. 

e.g.

```scss
.rule {
  &-suffix {
    color: blue;
  }
}

// becomes

.rule-suffix {
  color: blue;
}
```

Intended to improve "grepability" of the selectors that are produced in the browser.

### Usage

```bash
scss-codemods union-class-name --reorder never <files>
```

### Options

#### `--reorder`

Determines the freedom provided to the codemod to reorder rules to better match the desired format (default: `never`).


**Values:**
- `never`: won't promote rules if it would result in the reordering of selectors.
- `safe-only`: will promote rules that result in the reordering of selectors as long as the reordered selectors don't have the same specificity.
- `allow-unsafe`: will promote rules regardless of reordering, could result in differing styles if both classes are used on the same element and there's conflicting properties.

*Recommended that you test the resulting css thoroughly, especially with the `allow-unsafe` option.*

#### `--promote-dollar-vars`

Determines how dollar vars will be promoted (default: `global`). **not implemented**

**Values:**
- `no-global`: won't promote a dollar var to global context, prevents some rules from being promoted.
- `global`: allows promoting dollar vars to global

#### Not Implemented: `--namespace-dollar-vars`

Determines how dollar var promotion namespacing behavior (default: `never`).

- `never`: will promote a dollar var as necessary, will fail if there are duplicate vars at the same level as the promoted var.
- `when-necessary`: will namespace a dollar var with the classname it was promoted out of, will still fail if there is a duplicate promoted var.
- `always`: will always namespace dollar vars with the classname 

## `hex-to-tokens`

Replaces hex colors with tokens defined in a config. Allows for close matches through use of [Delta E](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000) color distance algorithm.

e.g.

```
.rule {
  color: #0000FF
}

// becomes

.rule {
  color: $blue;
}
```

### Usage

```bash
scss-codemods hex-to-tokens --config tokens.json <files>
```

### Options

#### `--config`

Path to a `json` file with the following format:
```json
[
  {
    "hex": "#ffffff",
    "name": "$white"
  },
  {

    "hex": "#f8f9fa",
    "name": "$gray-100"
  },
  ...
]
```

#### `--threshold`

A number within the range [0, 100] representing the Delta E [threshold](http://zschuessler.github.io/DeltaE/learn/#toc-defining-delta-e) for color matches (default: `0`).
