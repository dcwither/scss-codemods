const removeDashAmpersand = require("./plugins/remove-dash-ampersand");
const removeEmptyRules = require("./plugins/remove-empty-rules");
const removeNestedUnusedDollarVars = require("./plugins/remove-nested-unused-dollar-vars");
const postcssScss = require("postcss-scss");
const argv = require("minimist")(process.argv.slice(2));

module.exports = {
  parser: postcssScss,
  plugins: [
    removeDashAmpersand({
      reorder: argv.reorder,
    }),
    removeNestedUnusedDollarVars(),
    removeEmptyRules(),
  ],
};
