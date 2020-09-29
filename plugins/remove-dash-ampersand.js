function shouldGoAfter(decl, node) {
  return (
    node.type === "comment" ||
    (node.type === "atrule" && node.name === "import") ||
    (node.type === "decl" &&
      node.prop.startsWith("$") &&
      !node.value.includes(decl.prop))
  );
}

function insertDeclInPlace(parent, decl) {
  let beforeNode = parent.first;

  while (
    // Should go after initial comments and existing variable declarations
    shouldGoAfter(decl, beforeNode)
  ) {
    beforeNode = beforeNode.next();
  }

  parent.insertBefore(beforeNode, decl);
}

function recursivePromoteDollarDecls(dollarProps, decl, ruleParent, rule) {
  for (const [dollarProp, dollarDecl] of Object.entries(dollarProps)) {
    if (decl.value.includes(dollarProp) && ruleParent === dollarDecl.parent) {
      insertDeclInPlace(dollarDecl.parent.parent, dollarDecl);
      recursivePromoteDollarDecls(dollarProps, dollarDecl, ruleParent, rule);
    }
  }
}

function parentHasMatchingDollarDecl(rule, decl) {}

function getSelectors(rule) {
  return rule.selector.split(",").map((selector) => selector.trim());
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

        const selectors = getSelectors(rule);

        if (selectors.every((selector) => selector.startsWith("&-"))) {
          rule.selector = getSelectors(rule.parent)
            .map((parentSelector) =>
              rule.selector.replace(/&/g, parentSelector)
            )
            .join(", ");
          if (lastParent !== ruleParent) {
            insertAfterTarget = lastParent = ruleParent;
          }

          // Look in rule to see if it contains dollar vars declared in parent
          rule.walkDecls((decl) => {
            recursivePromoteDollarDecls(dollarProps, decl, ruleParent, rule);
          });

          // https://postcss.org/api/#atrule-insertafter
          ruleParent.parent.insertAfter(insertAfterTarget, rule);
          insertAfterTarget = rule;
        }
      });
    },
  };
};
