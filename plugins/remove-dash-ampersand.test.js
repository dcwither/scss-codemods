const { createProcessor } = require("../test-helpers");
const removeDashAmpersand = require("./remove-dash-ampersand");

function testCommonBehavior(process) {
  describe("unwind", () => {
    it("should fold out dash ampersand rules", async () => {
      expect(
        await process(`
          .rule { 
            &-part1 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {}
        .rule-part1 {}
      `);
    });

    it("should work with multiple child rules", async () => {
      expect(
        await process(`
          .rule { 
            &-extension1 {} 
            &-extension2 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {}
        .rule-extension1 {}
        .rule-extension2 {}
      `);
    });

    // Test insert after respects parent changes

    it("should work with nested child rules", async () => {
      expect(
        await process(`
          .rule { 
            &-part1 { 
              &-part2 {}
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {}
        .rule-part1 {}
        .rule-part1-part2 {}
      `);
    });

    it("should maintain expanded order", async () => {
      expect(
        await process(`
          .rule1 {
            &-part1 {}
          }
    
          .rule2 {
            &-part2 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1 {}
        .rule1-part1 {}

        .rule2 {}

        .rule2-part2 {}
      `);
    });

    it("should skip rules with only some &- selectors", async () => {
      expect(
        await process(`
          .rule { 
            &-part1,
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {
          &-part1,
          .something-else {}
        }
      `);
    });

    it("should work with multiple parent selectors", async () => {
      expect(
        await process(`
          .rule1,
          .rule2 { 
            &-part1 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1,
        .rule2 {}
        .rule1-part1,
        .rule2-part1 {}
      `);
    });

    it("should fully transform rules with multiple &- selectors", async () => {
      expect(
        await process(`
          .rule { 
            &-part1,
            &-part2 {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {}
        .rule-part1,
        .rule-part2 {}
      `);
    });

    it("should work with multiple parent selectors, and multiple &- selectors", async () => {
      expect(
        await process(`
          .rule1,
          .rule2 { 
            &-part1,
            &-part2 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1,
        .rule2 {}
        .rule1-part1,
        .rule1-part2,
        .rule2-part1,
        .rule2-part2 {}
      `);
    });
  });

  describe("dollar vars", () => {
    it("should leave root variables where they are", async () => {
      expect(
        await process(`
          $blue: #0000FF;

          .rule {}
        `)
      ).toMatchInlineSnapshot(`
        $blue: #0000ff;

        .rule {}
      `);
    });

    it("should promote duplicate variables when possible", async () => {
      expect(
        await process(`
          .rule {
            $blue: #0000FF;
            &-part1 {
              $blue: #0000BB;
              &-part2 {
                color: $blue;
              }
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        $blue: #0000bb;
        .rule {
          $blue: #0000ff;
        }
        .rule-part1 {}
        .rule-part1-part2 {
          color: $blue;
        }
      `);
    });

    it("should throw when unable to promote duplicate variables", async () => {
      expect(
        async () =>
          await process(`
            $blue: #0000FF;

            .rule {
              $blue: #0000BB;
              &-part1 {
                color: $blue
              }
            }
          `)
      ).rejects.toMatchInlineSnapshot(
        `[Error: cannot promote decl $blue: #0000BB at 5:15]`
      );
    });

    it("should promote a variable along with dependent rules", async () => {
      expect(
        await process(`
          .rule {
            $blue: #0000FF;
            
            &-part1 {
              color: $blue;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        $blue: #0000ff;
        .rule {}
        .rule-part1 {
          color: $blue;
        }
      `);
    });

    it("should places rules after first comments, imports and declarations", async () => {
      expect(
        await process(`
          // comment
          @import "something";

          $var: 1;
          .rule {
            $blue: #0000FF;
            
            &-part1 {
              color: $blue;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        // comment
        @import "something";

        $var: 1;
        $blue: #0000ff;
        .rule {}
        .rule-part1 {
          color: $blue;
        }
      `);
    });
    it("should respect $var order dependencies", async () => {
      expect(
        await process(`
          // comment
          @import "something";
  
          $var: 1;
          .rule {
            $blue: #0000FF;
            $light-blue: lighten($blue, 0.2);
            
            &-part1 {
              background-color: $light-blue;
              color: $blue;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        // comment
        @import "something";

        $var: 1;
        $blue: #0000ff;
        $light-blue: lighten($blue, 0.2);
        .rule {}
        .rule-part1 {
          background-color: $light-blue;
          color: $blue;
        }
      `);
    });

    it("should respect recursive $var dependencies", async () => {
      expect(
        await process(`
          // comment
          @import "something";
  
          $var: 1;
          .rule {
            $blue: #0000FF;
            $light-blue: lighten($blue, 0.2);
            
            &-part1 {
              color: $light-blue;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        // comment
        @import "something";

        $var: 1;
        $blue: #0000ff;
        $light-blue: lighten($blue, 0.2);
        .rule {}
        .rule-part1 {
          color: $light-blue;
        }
      `);
    });
  });
}

describe("remove-dash-ampersand", () => {
  describe("unsafe-reorder", () => {
    const process = createProcessor(
      removeDashAmpersand({ reorder: "unsafe-reorder" })
    );

    testCommonBehavior(process);

    it("should not affect rules without &-", async () => {
      expect(
        await process(`
          .rule { 
            &-part1 {} 
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {
          .something-else {}
        }
        .rule-part1 {}
      `);
    });
  });

  describe("no-reorder", () => {
    const process = createProcessor(
      removeDashAmpersand({ reorder: "no-reorder" })
    );

    testCommonBehavior(process);

    it("should abandon changes that reorder selectors", async () => {
      expect(
        await process(`
          .rule1 { 
            &-part1 {}
            &-part2 {}
            .something-else1 {}
            .something-else2 {} 
          }
          .rule2 { 
            &-part1 {}
            &-part2 {}
            .something-else1 {}
            .something-else2 {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1 {
          &-part1 {}
          &-part2 {}
          .something-else1 {}
          .something-else2 {}
        }
        .rule2 {
          &-part1 {}
          &-part2 {}
          .something-else1 {}
          .something-else2 {}
        }
      `);
    });

    it("should allow for partial migrations with the changes that don't change orders", async () => {
      expect(
        await process(`
          .rule1 { 
            &-part1 {}
            &-part2 {}
            .something-else1 {}
            .something-else2 {} 
          }
          .rule2 { 
            &-part1 {}
            &-part2 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1 {
          &-part1 {}
          &-part2 {}
          .something-else1 {}
          .something-else2 {}
        }
        .rule2 {}
        .rule2-part1 {}
        .rule2-part2 {}
      `);
    });
  });
});
