import { compareSelectorLists, getSelectorList } from "./selectors";

import { createProcessor } from "utils/postcss";

const process = createProcessor({
  postcssPlugin: "identity",
  Once() {},
});
const selectorsFromSCSS = async (scss: string) => {
  return getSelectorList(await process(scss).root);
};

describe("selectors", () => {
  describe("#getSelectorList", () => {
    it("should produce a selector list from a single rule", async () => {
      expect(
        await selectorsFromSCSS(`
          .rule {}
        `)
      ).toEqual([".rule"]);
    });

    it("should produce a selector list from a media query", async () => {
      expect(
        await selectorsFromSCSS(`
          .rule {
            @media (min-width: 600px) {
              &-part {}
            }
          }
        `)
      ).toEqual([".rule", ".rule-part"]);
    });

    it("should produce a selector list from nesting selector", async () => {
      expect(
        await selectorsFromSCSS(`
          .rule {
            &-part {}
          }
        `)
      ).toEqual([".rule", ".rule-part"]);
    });

    it("should expand comma selectors", async () => {
      expect(
        await selectorsFromSCSS(`
          .rule1,
          .rule2 {
            &-part1,
            &-part2 {}
          }
        `)
      ).toEqual([
        ".rule1",
        ".rule2",
        ".rule1-part1",
        ".rule1-part2",
        ".rule2-part1",
        ".rule2-part2",
      ]);
    });
  });

  describe("#compareSelectorLists", () => {
    it("should identify empty lists as NO_CHANGES", () => {
      expect(compareSelectorLists([], [])).toEqual("NO_CHANGES");
    });

    it("should identify no changes", async () => {
      expect(
        compareSelectorLists(
          await selectorsFromSCSS(`
            .rule1 { 
              &-part1 {}
              &-part2 {}
            }
          `),
          await selectorsFromSCSS(`
            .rule1 {}
            .rule1-part1 {}
            .rule1-part2 {}
          `)
        )
      ).toEqual("NO_CHANGES");
    });

    it("should identify safe changes in simple list", async () => {
      expect(
        compareSelectorLists(
          await selectorsFromSCSS(`
            .rule1 { 
              &-part1 {}
              .something-else {}
            }
          `),
          await selectorsFromSCSS(`
            .rule1 {
              .something-else {}
            }
            .rule1-part1 {}
          `)
        )
      ).toEqual("SAFE_CHANGES");
    });

    it("should identify safe changes with interleaved parts", async () => {
      expect(
        compareSelectorLists(
          await selectorsFromSCSS(`
            .rule1 { 
              &-part1 {}
              .something-else {}
              &-part2 {}
            }
          `),
          await selectorsFromSCSS(`
            .rule1 {
              .something-else {}
            }
            .rule1-part1 {}
            .rule1-part2 {}
          `)
        )
      ).toEqual("SAFE_CHANGES");
    });

    it("should identify safe changes in complex list", async () => {
      expect(
        compareSelectorLists(
          await selectorsFromSCSS(`
            .rule1 { 
              &-part1 {} 
              .something-else {} 
            }
            .rule2 { 
              &-part1 .more.specificity {} 
              .something-else {} 
            }
          `),
          await selectorsFromSCSS(`
            .rule1 {
              .something-else {}
            }
            .rule1-part1 {}
            .rule2 {
              .something-else {}
            }
            .rule2-part1 .more.specificity {}
          `)
        )
      ).toEqual("SAFE_CHANGES");
    });

    it("should identify unsafe changes in simple list", async () => {
      expect(
        compareSelectorLists(
          await selectorsFromSCSS(`
            .rule1 { 
              &-part1 .same-specificity {}
              .something-else {}
            }
          `),
          await selectorsFromSCSS(`
            .rule1 {
              .something-else {}
            }
            .rule1-part1 .same-specificity {}
          `)
        )
      ).toEqual("UNSAFE_CHANGES");
    });

    it("should identify unsafe changes with interleaved parts", async () => {
      expect(
        compareSelectorLists(
          await selectorsFromSCSS(`
            .rule1 { 
              &-part1 {}
              .something-else1 {}
              &-part2 .same-specificity {}
              .something-else2 {}
            }
          `),
          await selectorsFromSCSS(`
            .rule1 {
              .something-else1 {}
              .something-else2 {}
            }
            .rule1-part1 {}
            .rule1-part2 .same-specificity {}
          `)
        )
      ).toEqual("UNSAFE_CHANGES");
    });
  });
});
