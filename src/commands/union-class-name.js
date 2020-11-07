import { createProcessor, processFiles } from "utils/postcss";

import removeEmptyRules from "plugins/remove-empty-rules";
import removeNestedUnusedDollarVars from "plugins/remove-nested-unused-dollar-vars";
import removeNestingSelector from "plugins/remove-nesting-selector";

export const command = "union-class-name <files...>";
export const describe =
  "Promotes union class rules to the parent level to improve grepability";

export const builder = {
  r: {
    alias: "reorder",
    describe: "reorder promoted rules rules ",
    choices: ["never", "safe-only", "allow-unsafe"],
    default: "never",
  },
  p: {
    alias: "promote-dollar-vars",
    describe: "promote dollar vars to global scope",
    choices: ["no-global", "global"],
    default: "global",
  },
  n: {
    alias: "namespace-dollar-vars",
    describe: "namespace promoted dollar vars",
    choices: ["never", "when-necessary", "always"],
    default: "never",
  },
};

export const handler = (argv) => {
  return processFiles(
    argv.files,
    createProcessor([
      removeNestingSelector({
        reorder: argv.reorder,
        promoteDollarVars: argv.promoteDollarVars,
        namespaceDollarVars: argv.namespaceDollarVars,
      }),
      removeNestedUnusedDollarVars(),
      removeEmptyRules(),
    ])
  );
};
