import LazyResult from "postcss/lib/lazy-result";
import { createProcessor } from "utils/postcss";
import removeDashAmpersand from "./remove-dash-ampersand";

function testCommonBehavior(process: (css: string) => LazyResult) {
  describe("unwind", () => {
    it("should fold out dash ampersand rules", async () => {
      expect(
        await process(`
          .rule { 
            &-part1 {}
          }
        `)
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
        .rule1,
        .rule2 {}
        .rule1-part1,
        .rule1-part2,
        .rule2-part1,
        .rule2-part2 {}
      `);
    });
  });

  describe("comments", () => {
    it("should promote comments immediately preceding promoted rules", async () => {
      expect(
        await process(`
          .rule {
            // preceding comment
            // second preceding comment
            &-part {}
          }
        `)
      ).toMatchCSS(`
        .rule {}
        // preceding comment
        // second preceding comment
        .rule-part {}
      `);
    });

    it("shouldn't promote comments preceding other rules", async () => {
      expect(
        await process(`
          .rule {
            // indirectly preceding comment
            .something else {}
            &-part {}
          }
        `)
      ).toMatchCSS(`
        .rule {
          // indirectly preceding comment
          .something else {}
        }
        .rule-part {}
      `);
    });

    it("shouldn't promote comments following promoted rules", async () => {
      expect(
        await process(`
          .rule {
            &-part {}
            // following comment
          }
        `)
      ).toMatchCSS(`
        .rule {
          // following comment
        }
        .rule-part {}
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
        `[Error: Cannot promote decl $blue: #0000BB at 5:15]`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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

    it(`shouldn't promote dollar vars that aren't used by promoted rules`, async () => {
      expect(
        await process(`
          // comment
          @import "something";
  
          $var: 1;
          .rule {
            $blue: #0000FF;
            $light-blue: #5555FF;
            &-part1 {
              color: $light-blue;
            }
          }
        `)
      ).toMatchCSS(`
        // comment
        @import "something";

        $var: 1;
        $light-blue: #5555ff;
        .rule {
          $blue: #0000ff;
        }
        .rule-part1 {
          color: $light-blue;
        }
      `);
    });
  });
}

describe("remove-dash-ampersand", () => {
  describe("reorder: never", () => {
    const process = createProcessor(removeDashAmpersand({ reorder: "never" }));

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
      ).toMatchCSS(`
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
      ).toMatchCSS(`
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

  describe("reorder: safe-only", () => {
    const process = createProcessor(
      removeDashAmpersand({ reorder: "safe-only" })
    );

    testCommonBehavior(process);

    it("should apply changes if reordered selectors have different specificity", async () => {
      expect(
        await process(`
          .rule1 { 
            &-part1 {} 
            .something-else {} 
          }
          .rule2 { 
            &-part1 .more.specificity {} 
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1 {
          .something-else {}
        }
        .rule1-part1 {}
        .rule2 {
          .something-else {}
        }
        .rule2-part1 .more.specificity {}
      `);
    });

    it("shouldn't apply changes if reordered selectors have same specificity", async () => {
      expect(
        await process(`
          .rule1 { 
            &-part1 .same-specificity {} 
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule1 {
          &-part1 .same-specificity {}
          .something-else {}
        }
      `);
    });
  });

  describe("reorder: allow-unsafe", () => {
    const process = createProcessor(
      removeDashAmpersand({ reorder: "allow-unsafe" })
    );

    testCommonBehavior(process);

    it("should apply changes regardless selector reordering", async () => {
      expect(
        await process(`
          .rule { 
            &-part1 .same-specificity {} 
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {
          .something-else {}
        }
        .rule-part1 .same-specificity {}
      `);
    });
  });

  describe("promote-dollar-vars: no-global", () => {
    const process = createProcessor(
      removeDashAmpersand({ promoteDollarVars: "no-global" })
    );

    it("won't promote rules with dollar vars that will be promoted to global", async () => {
      expect(
        await process(`
          .rule { 
            $var: blue;
            &-part1 {
              color: $var;
            } 
          }
        `)
      ).toMatchInlineSnapshot(`
        .rule {
          $var: blue;
          .rule-part1 {
            color: $var;
          }
        }
      `);
    });
  });

  describe("multiple runs", () => {
    it.todo(
      "executing transforms one after the other maintains relative order"
    );
  });
});
