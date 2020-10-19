import type { AtRule, Root, Rule } from "postcss";

import { compare } from "specificity";
import log from "npmlog";

type ContainerNode = AtRule | Root | Rule;

function formatSelector(selector: string) {
  return selector.replace(/\s\s*/g, " ").trim();
}

export function combineSelectors(
  parentSelector: string,
  childSelector: string
) {
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

export function constructSelector(node: ContainerNode): string {
  if (node.type === "root") {
    return "";
  }
  const parent = node.parent as ContainerNode;
  if (node.type === "atrule") {
    return constructSelector(parent);
  } else {
    const parentSelector = constructSelector(parent);
    return combineSelectors(parentSelector, node.selector);
  }
}

export function getSelectors(selector: string) {
  return selector
    .split(",")
    .map((selector) => selector.replace(/\s\s*/g, " ").trim());
}

export function getSelectorList(root: Root) {
  let selectors: string[] = [];
  root.walkRules((rule: Rule) => {
    selectors = selectors.concat(
      constructSelector(rule).split(",").map(formatSelector)
    );
  });

  return selectors;
}

export function getSkipped(
  precedingBefore: string[],
  precedingAfter: string[]
) {
  const skipped = [];
  for (const selector of precedingAfter) {
    if (!precedingBefore.includes(selector)) {
      skipped.push(selector);
    }
  }
  return skipped;
}

export function compareSelectorLists(before: string[], after: string[]) {
  if (before.join("\n") === after.join("\n")) {
    return "NO_CHANGES";
  }

  const lastSeen: Record<string, number> = {};

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
      log.silly(
        "selectors",
        `${selector} skipped ${delta} rules: ${skippedSelectors}`
      );
      for (const skippedSelector of skippedSelectors) {
        // moved selector has the same specificity as a skipped selector
        if (compare(selector, skippedSelector) === 0) {
          log.silly(
            "selectors",
            `"${selector}" might have made a bad move past "${skippedSelectors} with the same specificity"`
          );
          return "UNSAFE_CHANGES";
        }
      }
    }
  }
  return "SAFE_CHANGES";
}
