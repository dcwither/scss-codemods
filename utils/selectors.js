/**
 * TODO: tests
 * - normal
 * - multiple parents
 * - &-rule
 * - & &-rule
 * - .rule &
 * - media query
 */
function constructSelector(node) {
  if (node.type === "root") {
    return "";
  } else if (node.type === "atrule") {
    return constructSelector(node.parent);
  } else {
    const parentSelector = constructSelector(node.parent);
    return combineSelectors(parentSelector, node.selector);
  }
}

function getSelectors(selector) {
  return selector.split(",").map((selector) => selector.trim());
}

function combineSelectors(parentSelector, childSelector) {
  if (childSelector.includes("&")) {
    return getSelectors(parentSelector)
      .map((parentSelector) => childSelector.replace(/&/g, parentSelector))
      .join(", ")
      .replace(/\s\s*/g, " ")
      .trim();
  } else {
    return `${parentSelector} ${childSelector}`.trim();
  }
}

function getSelectorList(root) {
  const selectors = [];
  root.walkRules((rule) => {
    selectors.push(constructSelector(rule));
  });

  return selectors;
}

function compareSelectorLists(before, after) {
  return before.join("\n") === after.join("\n");
}

module.exports = {
  combineSelectors,
  compareSelectorLists,
  getSelectorList,
  getSelectors,
};
