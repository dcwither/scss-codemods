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
        throw new Error(
          `Cannot promote decl ${dollarDecl} at ${dollarDecl.source.start.line}:${dollarDecl.source.start.column}`
        );
      }

      insertDeclInPlace(dollarDecl.parent.parent, dollarDecl);
      recursivePromoteDollarDecls(dollarDecls, dollarDecl, rule);
    }
  }
}

function promoteNestingSelectorRules(parent, dollarDecls) {
  let insertAfterTarget = parent;
  let toPromote = [];
  parent.each((child) => {
    if (child.type === "comment") {
      toPromote.push(child);
      return;
    } else if (child.type !== "rule") {
      toPromote = [];
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

      toPromote.push(rule);
      for (const promoteNode of toPromote) {
        // https://postcss.org/api/#atrule-insertafter
        parent.parent.insertAfter(insertAfterTarget, promoteNode);
        insertAfterTarget = promoteNode;
      }
    }
    toPromote = [];
  });
}

function shouldPromoteNestingSelectorRules(
  rule,
  reorder,
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
      return reorder === "safe-reorder" || reorder === "unsafe-reorder";
    case "UNSAFE_CHANGES":
      return reorder === "unsafe-reorder";
  }
}

module.exports = ({ reorder } = { reorder: "no-reorder" }) => {
  // Work with options here
  return {
    postcssPlugin: "remove-dash-ampersand",
    Root(root, postcss) {
      const dollarDecls = new DollarDeclTree(root);

      root.walkRules((rule) => {
        if (
          shouldPromoteNestingSelectorRules(rule, reorder, dollarDecls, postcss)
        ) {
          promoteNestingSelectorRules(rule, dollarDecls);
        }
      });
    },
  };
};
