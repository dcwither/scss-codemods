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
          rule.walkDecls(/^\$/, (decl) => {
            toRemove[decl.prop] = decl;
          });

          rule.walkDecls((decl) => {
            // are any of the dollar decls used in the values of other decls
            for (const [dollarProp, dollarDecl] of Object.entries(toRemove)) {
              if (decl.value.includes(dollarProp)) {
                delete toRemove[dollarProp];
              }
            }
          });

          rule.walkAtRules((atRule) => {
            // are any of the dollar decls used in the params of @ rules
            for (const [dollarProp, dollarDecl] of Object.entries(toRemove)) {
              if (atRule.params.includes(dollarProp)) {
                delete toRemove[dollarProp];
              }
            }
          });

          rule.walkRules(/\#\{\$/, (rule) => {
            // are any of the dollar decls interpolated into rules
            for (const [dollarProp, dollarDecl] of Object.entries(toRemove)) {
              if (rule.selector.includes(`#{${dollarProp}`)) {
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
