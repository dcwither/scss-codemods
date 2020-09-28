module.exports = (options = {}) => {
  // Work with options here
  return {
    postcssPlugin: "remove-nested-unused-dollar-vars",
    Root(root) {
      let removed;
      // innefficient, but simple - keep repeating until there's been no changes
      do {
        removed = false;
        root.walkRules((rule) => {
          const toRemove = {};
          rule.walkDecls((decl) => {
            if (decl.prop.startsWith("$")) {
              toRemove[decl.prop] = decl;
            }

            // are any of the declared props in the decls gathered?
            for (const [dollarProp, dollarDecl] of Object.entries(toRemove)) {
              if (decl.value.includes(dollarProp)) {
                delete toRemove[dollarProp];
              }
            }
          });

          // remove the ones that have no uses
          for (const [dollarProp, dollarDecl] of Object.entries(toRemove)) {
            dollarDecl.remove();
            removed = true;
          }
        });
      } while (removed === true);
    },
  };
};
