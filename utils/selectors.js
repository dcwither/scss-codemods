const { compare } = require("specificity");

function formatSelector(selector) {
  return selector.replace(/\s\s*/g, " ").trim();
}

function combineSelectors(parentSelector, childSelector) {
  if (childSelector.includes("&")) {
    return getSelectors(parentSelector)
      .map((parentSelector) => {
        return formatSelector(childSelector.replace(/&/g, parentSelector));
      })
      .join(", ");
  } else {
    return formatSelector(`${parentSelector} ${childSelector}`);
  }
}

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
  return selector
    .split(",")
    .map((selector) => selector.replace(/\s\s*/g, " ").trim());
}

function getSelectorList(root) {
  let selectors = [];
  root.walkRules((rule) => {
    selectors = selectors.concat(
      constructSelector(rule).split(",").map(formatSelector)
    );
  });

  return selectors;
}

function compareSelectorLists(before, after) {
  if (before.join("\n") === after.join("\n")) {
    return "NO_CHANGES";
  }

  // console.log(before, after);
  let prevDelta = 0;
  let skippedSelectors = [];
  for (let beforeIndex = 0; beforeIndex < before.length; beforeIndex++) {
    const selector = before[beforeIndex];
    const delta = after.indexOf(selector, beforeIndex) - beforeIndex;

    if (delta !== prevDelta) {
      if (delta > 0) {
        prevDelta = delta;
        skippedSelectors = after.slice(beforeIndex, beforeIndex + delta);
      } else {
        prevDelta = 0;
        skippedSelectors = [];
      }
    }
    if (prevDelta > 0) {
      // Keep for now: debugging logs for unsafe change detection
      // console.log(`${selector} skipped ${delta} rules: ${skippedSelectors}`);
      for (const skippedSelector of skippedSelectors) {
        // moved selector has the same specificity as a skipped selector
        if (compare(selector, skippedSelector) === 0) {
          // console.log(
          //   `"${movedSelector}" might have made a bad move past "${skippedSelectors} with the same specificity"`
          // );
          return "UNSAFE_CHANGES";
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
