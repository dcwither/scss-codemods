/* eslint-env node */

const removeDashAmpersand = require("./plugins/remove-dash-ampersand");

module.exports = {
  parser: "postcss-scss",
  plugins: [removeDashAmpersand],
};
