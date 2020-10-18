export default (options = {}) => {
  // Work with options here
  return {
    postcssPlugin: "remove-empty-rules",
    Root(root) {
      let removed;
      // innefficient, but simple - keep repeating until there's been no changes
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
