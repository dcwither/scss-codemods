const { getSelectorList, compareSelectorLists } = require("./selectors");
const { createProcessor } = require("../test-helpers");

const process = createProcessor({
  postcssPlugin: "identity",
  Root() {},
});
const selectorsFromSCSS = async (scss) => {
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

    it("should identify no changes", () => {
      expect(
        compareSelectorLists(
          [".rule1", ".rule1 .something-else1", ".rule1-part1"],
          [".rule1", ".rule1 .something-else1", ".rule1-part1"]
        )
      ).toEqual("NO_CHANGES");
    });

    it("should identify safe changes in simple list", () => {
      expect(
        compareSelectorLists(
          [".rule1", ".rule1-part1", ".rule1 .something-else1"],
          [".rule1", ".rule1 .something-else1", ".rule1-part1"]
        )
      ).toEqual("SAFE_CHANGES");
    });

    it("should identify safe changes in complex list", () => {
      expect(
        compareSelectorLists(
          [
            ".rule1",
            ".rule1-part1",
            ".rule1-part2",
            ".rule1 .something-else1",
            ".rule1 .something-else2",
            ".rule2",
            ".rule2-part1",
            ".rule2-part2",
            ".rule2 .something-else1",
            ".rule2 .something-else2",
          ],
          [
            ".rule1",
            ".rule1 .something-else1",
            ".rule1 .something-else2",
            ".rule1-part1",
            ".rule1-part2",
            ".rule2",
            ".rule2 .something-else1",
            ".rule2 .something-else2",
            ".rule2-part1",
            ".rule2-part2",
          ]
        )
      ).toEqual("SAFE_CHANGES");
    });

    it("should identify unsafe changes in simple list", () => {
      expect(
        compareSelectorLists(
          [".rule1", ".rule1-part1 .rule", ".rule1 .something-else1"],
          [".rule1", ".rule1 .something-else1", ".rule1-part1 .rule"]
        )
      ).toEqual("UNSAFE_CHANGES");
    });

    it("should identify unsafe changes in complex list", () => {
      expect(
        compareSelectorLists(
          [
            ".rule1",
            ".rule1-part1 .rule",
            ".rule1-part2",
            ".rule1 .something-else1",
            ".rule1 .something-else2",
            ".rule2",
            ".rule2-part1",
            ".rule2-part2",
            ".rule2 .something-else1",
            ".rule2 .something-else2",
          ],
          [
            ".rule1",
            ".rule1 .something-else1",
            ".rule1 .something-else2",
            ".rule1-part1 .rule",
            ".rule1-part2",
            ".rule2",
            ".rule2 .something-else1",
            ".rule2 .something-else2",
            ".rule2-part1",
            ".rule2-part2",
          ]
        )
      ).toEqual("UNSAFE_CHANGES");
    });
  });
});
