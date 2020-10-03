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

module.exports = ({ strategy } = { strategy: "safe" }) => {
  // Work with options here
  return {
    postcssPlugin: "remove-dash-ampersand",
    Root(root) {
      const workingRoot = root.clone();
      let lastParent = null;
      let insertAfterTarget = null;

      const dollarDecls = new DollarDeclTree(workingRoot);

      workingRoot.walkRules((rule) => {
        // produce rule's top level decls

        if (rule.parent.type !== "rule") {
          // ignore media queries for now
          return;
        }

        const selectors = getSelectors(rule.selector);

        if (selectors.every((selector) => selector.startsWith("&-"))) {
          rule.selector = combineSelectors(rule.parent.selector, rule.selector);
          if (lastParent !== rule.parent) {
            insertAfterTarget = lastParent = rule.parent;
          }

          // Look in rule to see if it contains dollar vars declared in parent
          rule.walkDecls((decl) => {
            recursivePromoteDollarDecls(dollarDecls, decl, rule);
          });

          // https://postcss.org/api/#atrule-insertafter
          rule.parent.parent.insertAfter(insertAfterTarget, rule);
          insertAfterTarget = rule;
        }
      });

      switch (strategy) {
        case "safe":
          if (
            compareSelectorLists(
              getSelectorList(root),
              getSelectorList(workingRoot)
            ) === "NO_CHANGES"
          ) {
            root.removeAll();
            root.append(workingRoot.nodes);
          }
          return;
        case "cautious":
          if (
            compareSelectorLists(
              getSelectorList(root),
              getSelectorList(workingRoot)
            ) !== "UNSAFE_CHANGES"
          ) {
            root.removeAll();
            root.append(workingRoot.nodes);
          }
          return;

        case "aggressive":
          root.removeAll();
          root.append(workingRoot.nodes);
          return;
      }
    },
  };
};
