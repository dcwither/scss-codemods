function isStarterNode(node) {
  return (
    node.type === "comment" ||
    (node.type === "decl" && node.prop.startsWith("$")) ||
    (node.type === "atrule" && node.name === "import")
  );
}

function insertAfterDollarDecls(parent, node) {
  let beforeNode = parent.first;

  while (
    // Should go after initial comments and existing variable declarations
    isStarterNode(beforeNode)
  ) {
    beforeNode = beforeNode.next();
  }

  parent.insertBefore(beforeNode, node);
}

module.exports = (options = {}) => {
  // Work with options here
  return {
    postcssPlugin: "remove-dash-ampersand",
    Root(root) {
      let lastParent = null;
      let insertAfterTarget = null;

      const dollarProps = {};
      root.walkDecls((decl) => {
        if (dollarProps[decl.prop] !== undefined) {
          console.trace(`There is a duplicate declaration ${decl.prop}`);
          dollarProps[decl.prop] = null;
        }

        if (decl.prop.startsWith("$") && decl.parent !== root) {
          dollarProps[decl.prop] = decl;
        }
      });

      root.walkRules((rule) => {
        const ruleParent = rule.parent;
        if (ruleParent.type !== "rule") {
          // ignore media queries for now
          return;
        }

        const selectors = rule.selector
          .split(",")
          .map((selector) => selector.trim());

        if (selectors.every((selector) => selector.startsWith("&-"))) {
          rule.selector = rule.selector.replace(/&/g, ruleParent.selector);
          if (lastParent !== ruleParent) {
            insertAfterTarget = lastParent = ruleParent;
          }

          // Look in rule to see if it contains dollar vars declared in parent
          rule.walkDecls((decl) => {
            for (const [dollarProp, dollarDecl] of Object.entries(
              dollarProps
            )) {
              if (
                decl.value.includes(dollarProp) &&
                ruleParent === dollarDecl.parent
              ) {
                console.log(
                  `${dollarProp} was found in ${rule.selector} and needs to be moved`
                );

                insertAfterDollarDecls(dollarDecl.parent.parent, dollarDecl);
              }
            }
          });

          // https://postcss.org/api/#atrule-insertafter
          ruleParent.parent.insertAfter(insertAfterTarget, rule);
          insertAfterTarget = rule;
        }
      });
    },
  };
};
