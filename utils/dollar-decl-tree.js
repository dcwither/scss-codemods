function isAncestor(ancestor, descendant) {
  while (descendant) {
    if (ancestor === descendant) {
      return true;
    }
    descendant = descendant.parent;
  }

  return false;
}

module.exports = class DollarDeclTree {
  constructor(root) {
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
};
