const removeDashAmpersand = require("./plugins/remove-dash-ampersand");
const removeEmptyRules = require("./plugins/remove-empty-rules");
const removeNestedUnusedDollarVars = require("./plugins/remove-nested-unused-dollar-vars");
const argv = require("minimist")(process.argv.slice(2));

module.exports = {
  parser: "postcss-scss",
  plugins: [
    removeDashAmpersand({
      reorder: argv.reorder,
    }),
    removeNestedUnusedDollarVars(),
    removeEmptyRules(),
  ],
};
