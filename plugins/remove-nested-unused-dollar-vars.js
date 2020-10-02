const DollarDeclTree = require("../utils/dollar-decl-tree");

module.exports = (options = {}) => {
  // Work with options here
  return {
    postcssPlugin: "remove-nested-unused-dollar-vars",
    Root(root) {
      new DollarDeclTree(root).removeUnused();
    },
  };
};
