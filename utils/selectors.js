const { compare } = require("specificity");
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
  if (before.join("\n") === after.join("\n")) {
    return "NO_CHANGES";
  }

  // console.log(before, after);
  let prevDelta = 0;
  let skippedRules = [];
  for (let beforeIndex = 0; beforeIndex < before.length; beforeIndex++) {
    const selector = before[beforeIndex];
    const delta = after.indexOf(selector, beforeIndex) - beforeIndex;

    if (delta !== prevDelta) {
      if (delta > 0) {
        prevDelta = delta;
        skippedRules = after.slice(beforeIndex, beforeIndex + delta);
      } else {
        prevDelta = 0;
        skippedRules = [];
      }
    }
    if (prevDelta > 0) {
      // Keep for now: debugging logs for unsafe change detection
      // console.log(`${selector} skipped ${delta} rules: ${skippedRules}`);
      for (const movedSelector of getSelectors(selector)) {
        for (const skippedSelector of getSelectors(skippedRules.join(", "))) {
          // moved selector has the same specificity as a skipped selector
          if (compare(movedSelector, skippedSelector) === 0) {
            // console.log(
            //   `"${movedSelector}" might have made a bad move past "${skippedRules} with the same specificity"`
            // );
            return "UNSAFE_CHANGES";
          }
        }
      }
    }
  }
  return "SAFE_CHANGES";
}

module.exports = {
  combineSelectors,
  compareSelectorLists,
  getSelectorList,
  getSelectors,
};
