function isAncestor(ancestor, descendant) {
  while (descendant) {
    if (ancestor === descendant) {
      return true;
    }
    descendant = descendant.parent;
  }

  return false;
}

export default class DollarDeclTree {
  constructor(root) {
    this.root = root;
    this.dollarDecls = {};
    root.walkDecls(/^\$/, (decl) => {
      if (!this.dollarDecls[decl.prop]) {
        this.dollarDecls[decl.prop] = [decl];
      } else {
        this.dollarDecls[decl.prop].push(decl);
      }
    });

    // reverse entries so it's deepest to shallowest
    for (const decls of Object.values(this.dollarDecls)) {
      decls.reverse();
    }
  }

  get props() {
    return Object.keys(this.dollarDecls);
  }

  get entries() {
    const entries = [];
    for (const [prop, decls] of Object.entries(this.dollarDecls)) {
      for (const decl of decls) {
        entries.push([prop, decl]);
      }
    }

    return entries;
  }

  getDollarDecl(node, prop) {
    for (const decl of this.dollarDecls[prop] || []) {
      if (isAncestor(decl.parent, node)) {
        return decl;
      }
    }

    return null;
  }

  canPromoteDecl(decl) {
    for (const possibleParentDecl of this.dollarDecls[decl.prop] || []) {
      if (possibleParentDecl.parent === decl.parent.parent) {
        return false;
      }
    }

    return true;
  }

  isDollarDeclUsed(dollarDecl) {
    let used = false;
    this.root.walkDecls((decl) => {
      // are any of the dollar decls used in the values of other decls
      if (
        decl.value.includes(dollarDecl.prop) &&
        this.getDollarDecl(decl, dollarDecl.prop) === dollarDecl
      ) {
        used = true;
      }
    });
    this.root.walkAtRules((atRule) => {
      // are any of the dollar decls used in the params of @ rules
      if (
        atRule.params.includes(dollarDecl.prop) &&
        this.getDollarDecl(atRule.parent, dollarDecl.prop) === dollarDecl
      ) {
        used = true;
      }
    });

    this.root.walkRules(/#\{\$/, (rule) => {
      // are any of the dollar decls interpolated into rules
      if (
        rule.selector.includes(`#{${dollarDecl.prop}`) &&
        this.getDollarDecl(rule.parent, dollarDecl.prop) === dollarDecl
      ) {
        used = true;
      }
    });

    return used;
  }

  removeUnused() {
    let removed;
    do {
      removed = false;
      for (const [, decl] of this.entries) {
        if (
          decl.parent &&
          decl.parent !== this.root &&
          !this.isDollarDeclUsed(decl)
        ) {
          // declaration is in the AST, it's not a root decl, and it's not used
          removed = true;
          decl.remove();
        }
      }
    } while (removed === true);
  }
};
