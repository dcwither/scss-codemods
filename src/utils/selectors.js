import { compare } from "specificity";
import log from "npmlog";

function formatSelector(selector) {
  return selector.replace(/\s\s*/g, " ").trim();
}

export function combineSelectors(parentSelector, childSelector) {
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

export function constructSelector(node) {
  if (node.type === "root") {
    return "";
  } else if (node.type === "atrule") {
    return constructSelector(node.parent);
  } else {
    const parentSelector = constructSelector(node.parent);
    return combineSelectors(parentSelector, node.selector);
  }
}

export function getSelectors(selector) {
  return selector
    .split(",")
    .map((selector) => selector.replace(/\s\s*/g, " ").trim());
}

export function getSelectorList(root) {
  let selectors = [];
  root.walkRules((rule) => {
    selectors = selectors.concat(
      constructSelector(rule).split(",").map(formatSelector)
    );
  });

  return selectors;
}

export function getSkipped(precedingBefore, precedingAfter) {
  const skipped = [];
  for (const selector of precedingAfter) {
    if (!precedingBefore.includes(selector)) {
      skipped.push(selector);
    }
  }
  return skipped;
}

export function compareSelectorLists(before, after) {
  if (before.join("\n") === after.join("\n")) {
    return "NO_CHANGES";
  }

  const lastSeen = {};

  for (let beforeIndex = 0; beforeIndex < before.length; beforeIndex++) {
    const selector = before[beforeIndex];
    // track when the selector was last seen in the after array to make sure we don't repeat
    const afterIndex = after.indexOf(selector, lastSeen[selector] + 1 || 0);
    lastSeen[selector] = afterIndex;

    const delta = afterIndex - beforeIndex;
    if (delta > 0) {
      const skippedSelectors = getSkipped(
        before.slice(0, beforeIndex + 1),
        after.slice(0, afterIndex + 1)
      );
      // Keep for now: debugging logs for unsafe change detection
      log.silly(`${selector} skipped ${delta} rules: ${skippedSelectors}`);
      for (const skippedSelector of skippedSelectors) {
        // moved selector has the same specificity as a skipped selector
        if (compare(selector, skippedSelector) === 0) {
          log.silly(
            `"${selector}" might have made a bad move past "${skippedSelectors} with the same specificity"`
          );
          return "UNSAFE_CHANGES";
        }
      }
    }
  }
  return "SAFE_CHANGES";
}
