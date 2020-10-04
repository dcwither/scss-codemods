const DollarDeclTree = require("../utils/dollar-decl-tree");
const {
  combineSelectors,
  compareSelectorLists,
  getSelectorList,
  getSelectors,
} = require("../utils/selectors");

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

function recursivePromoteDollarDecls(dollarDecls, decl, rule) {
  for (const dollarProp of dollarDecls.props) {
    const dollarDecl = dollarDecls.getDollarDecl(rule, dollarProp);
    if (dollarDecl && dollarDecl.parent === rule.parent) {
      if (!dollarDecls.canPromoteDecl(dollarDecl)) {
        throw new Error(`cannot promote decl ${dollarDecl}`);
      }

      insertDeclInPlace(dollarDecl.parent.parent, dollarDecl);
      recursivePromoteDollarDecls(dollarDecls, dollarDecl, rule);
    }
  }
}

function promoteNestingSelectorRules(parent, dollarDecls) {
  let insertAfterTarget = parent;
  parent.each((child) => {
    if (child.type !== "rule") {
      return;
    }
    const rule = child;
    const selectors = getSelectors(rule.selector);

    if (selectors.every((selector) => selector.startsWith("&-"))) {
      rule.selector = combineSelectors(rule.parent.selector, rule.selector);

      // Look in rule to see if it contains dollar vars declared in parent
      rule.walkDecls((decl) => {
        recursivePromoteDollarDecls(dollarDecls, decl, rule);
      });

      // https://postcss.org/api/#atrule-insertafter
      rule.parent.parent.insertAfter(insertAfterTarget, rule);
      insertAfterTarget = rule;
    }
  });
}

function shouldPromoteNestingSelectorRules(
  rule,
  strategy,
  dollarDecls,
  { Root }
) {
  const dryRunClone = rule.clone();
  // create a parent to put the dry run into
  new Root({}).append(dryRunClone);
  const beforeSelectorList = getSelectorList(dryRunClone.parent);

  promoteNestingSelectorRules(dryRunClone, dollarDecls);
  const difference = compareSelectorLists(
    beforeSelectorList,
    getSelectorList(dryRunClone.parent)
  );

  switch (difference) {
    case "NO_CHANGES":
      return true;
    case "SAFE_CHANGES":
      return strategy === "cautions" || strategy === "aggressive";
    case "UNSAFE_CHANGES":
      return strategy === "aggressive";
  }
}

module.exports = ({ strategy } = { strategy: "safe" }) => {
  // Work with options here
  return {
    postcssPlugin: "remove-dash-ampersand",
    Root(root, postcss) {
      const dollarDecls = new DollarDeclTree(root);

      root.walkRules((rule) => {
        if (
          shouldPromoteNestingSelectorRules(
            rule,
            strategy,
            dollarDecls,
            postcss
          )
        ) {
          promoteNestingSelectorRules(rule, dollarDecls);
        }
      });
    },
  };
};
