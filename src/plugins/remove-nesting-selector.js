import {
  combineSelectors,
  compareSelectorLists,
  getSelectorList,
  getSelectors,
} from "utils/selectors";

import DollarDeclTree from "utils/dollar-decl-tree";

class PromoteGlobalError extends Error {}
class DuplicateVarInScopeError extends Error {}

function shouldGoAfter(decl, node) {
  return (
    node.type === "comment" ||
    (node.type === "atrule" && node.name === "import") ||
    (node.type === "decl" &&
      node.prop.startsWith("$") &&
      !node.value.match(RegExp(`\\${decl.prop}(?![\\w-])`)))
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

  beforeNode.before(decl);
}

function recursivePromoteDollarDecls(dollarDecls, decl, rule, opts) {
  for (const dollarProp of dollarDecls.props) {
    const dollarDecl = dollarDecls.getDollarDecl(rule, dollarProp);
    if (
      decl.value.match(RegExp(`\\${dollarProp}(?![\\w-])`)) &&
      dollarDecl &&
      dollarDecl.parent === rule.parent
    ) {
      if (!dollarDecls.canPromoteDecl(dollarDecl)) {
        throw new DuplicateVarInScopeError(
          `Cannot promote decl ${dollarDecl} at ${dollarDecl.source.start.line}:${dollarDecl.source.start.column}`
        );
      }

      if (
        dollarDecl.parent.parent.type === "root" &&
        opts.promoteDollarVars === "no-global"
      ) {
        throw new PromoteGlobalError("cannot promote to global");
      }

      insertDeclInPlace(dollarDecl.parent.parent, dollarDecl);
      recursivePromoteDollarDecls(dollarDecls, dollarDecl, rule, opts);
    }
  }
}

function promoteNestingSelectorRules(parent, dollarDecls, opts) {
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

      try {
        // Look in rule to see if it contains dollar vars declared in parent
        rule.walkDecls((decl) => {
          recursivePromoteDollarDecls(dollarDecls, decl, rule, opts);
        });

        toPromote.push(rule);
        for (const promoteNode of toPromote) {
          // https://postcss.org/api/#atrule-insertafter
          parent.parent.insertAfter(insertAfterTarget, promoteNode);
          insertAfterTarget = promoteNode;
        }
      } catch (e) {
        if (!(e instanceof PromoteGlobalError)) {
          throw e;
        }
      }
    }
    toPromote = [];
  });
}

function shouldPromoteNestingSelectorRules(rule, dollarDecls, { Root }, opts) {
  const dryRunClone = rule.clone();
  // create a parent to put the dry run into
  new Root({}).append(dryRunClone);
  const beforeSelectorList = getSelectorList(dryRunClone.parent);

  promoteNestingSelectorRules(dryRunClone, dollarDecls, opts);
  const difference = compareSelectorLists(
    beforeSelectorList,
    getSelectorList(dryRunClone.parent)
  );

  switch (difference) {
    case "NO_CHANGES":
      return true;
    case "SAFE_CHANGES":
      return opts.reorder === "safe-only" || opts.reorder === "allow-unsafe";
    case "UNSAFE_CHANGES":
      return opts.reorder === "allow-unsafe";
  }
}

export default (opts) => {
  opts = {
    // default values
    reorder: "never",
    promoteDollarVars: "global",
    namespaceDollarVars: "never",
    ...opts,
  };
  // Work with options here
  return {
    postcssPlugin: "remove-nesting-selector",
    Once(root, postcss) {
      const dollarDecls = new DollarDeclTree(root);

      root.walkRules((rule) => {
        if (
          shouldPromoteNestingSelectorRules(rule, dollarDecls, postcss, opts)
        ) {
          promoteNestingSelectorRules(rule, dollarDecls, opts);
        }
      });
    },
  };
};
