const removeDashAmpersand = require("./plugins/remove-dash-ampersand");
const removeEmptyRules = require("./plugins/remove-empty-rules");
const removeNestedUnusedDollarVars = require("./plugins/remove-nested-unused-dollar-vars");

module.exports = {
  parser: "postcss-scss",
  plugins: [
    removeDashAmpersand(),
    removeNestedUnusedDollarVars(),
    removeEmptyRules(),
  ],
};
