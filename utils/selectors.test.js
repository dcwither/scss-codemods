const { compareSelectorLists } = require("./selectors");

describe("selectors", () => {
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
