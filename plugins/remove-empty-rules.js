module.exports = (options = {}) => {
  // Work with options here
  return {
    postcssPlugin: "remove-empty-rules",
    Root(root) {
      let removed;
      do {
        removed = false;
        root.walkRules((rule) => {
          if (rule.nodes.length === 0) {
            rule.remove();
            removed = true;
          }
        });
      } while (removed === true);
    },
  };
};
