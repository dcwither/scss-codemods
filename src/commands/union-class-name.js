const { createProcessor, processFiles } = require("../utils/postcss");
const removeDashAmpersand = require("../plugins/remove-dash-ampersand");
const removeEmptyRules = require("../plugins/remove-empty-rules");
const removeNestedUnusedDollarVars = require("../plugins/remove-nested-unused-dollar-vars");

exports.command = "union-class-name <files...>";

exports.describe =
  "Promotes union class rules to the parent level to improve grepability";

exports.builder = {
  r: {
    alias: "reorder",
    describe: "reorder promoted rules rules ",
    choices: ["no-reorder", "safe-reorder", "unsafe-reorder"],
    default: "no-reorder",
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
    choices: ["no-namespace", "namespace-when-necessary", "namespace-always"],
    default: "no-namespace",
  },
};

exports.handler = (argv) => {
  processFiles(
    argv.files,
    createProcessor([
      removeDashAmpersand({
        reorder: argv.reorder,
        promoteDollarVars: argv.promoteDollarVars,
        namespaceDollarVars: argv.namespaceDollarVars,
      }),
      removeNestedUnusedDollarVars(),
      removeEmptyRules(),
    ])
  );
};
