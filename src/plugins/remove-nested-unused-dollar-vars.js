import DollarDeclTree from "utils/dollar-decl-tree";

export default (options = {}) => {
  // Work with options here
  return {
    postcssPlugin: "remove-nested-unused-dollar-vars",
    Once(root) {
      new DollarDeclTree(root).removeUnused();
    },
  };
};
