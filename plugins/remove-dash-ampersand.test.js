const { createProcessor } = require("../test-helpers");
const dedent = require("dedent-js");
const removeDashAmpersand = require("./remove-dash-ampersand");

const process = createProcessor(removeDashAmpersand);

describe("remove-dash-ampersand", () => {
  describe("unwinding", () => {
    it("should fold out dash ampersand rules", async () => {
      expect(
        await process(dedent`
          .rule { 
            &-part1 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        ".rule {
        } 
          .rule-part1 {}"
      `);
    });

    it("should work with multiple child rules", async () => {
      expect(
        await process(dedent`
          .rule { 
            &-extension1 {} 
            &-extension2 {}
          }
        `)
      ).toMatchInlineSnapshot(`
        ".rule {
        } 
          .rule-extension1 {} 
          .rule-extension2 {}"
      `);
    });

    // Test insert after respects parent changes

    it("should work with nested child rules", async () => {
      expect(
        await process(dedent`
          .rule { 
            &-part1 { 
              &-part2 {}
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        ".rule {
        } 
          .rule-part1 {
          } 
          .rule-part1-part2 {}"
      `);
    });

    // it("should work with nested child rules", async () => {
    //   expect(
    //     await process(dedent`
    //       .rule {
    //         & &-part1 {}
    //       }
    //     `)
    //   ).toMatchInlineSnapshot(`
    //     ".rule {
    //       & &-part1 {}
    //     }"
    //   `);
    // });

    it("should not affect rules without &-", async () => {
      expect(
        await process(dedent`
          .rule { 
            &-part1 {} 
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        ".rule { 
          .something-else {} 
        } 
          .rule-part1 {}"
      `);
    });

    it("should not affect rules without &-", async () => {
      expect(
        await process(dedent`
          .rule { 
            &-part1 {} 
            .something-else {} 
          }
        `)
      ).toMatchInlineSnapshot(`
        ".rule { 
          .something-else {} 
        } 
          .rule-part1 {}"
      `);
    });

    it("should skip rules with only some &- selectors", async () => {
      expect(
        await process(dedent`
        .rule { 
          &-part1,
          .something-else {} 
        }`)
      ).toMatchInlineSnapshot(`
        ".rule { 
          &-part1,
          .something-else {} 
        }"
      `);
    });

    it("should work with multiple parent selectors", async () => {
      expect(
        await process(dedent`
        .rule1,
        .rule2 { 
          &-part1 {}
        }`)
      ).toMatchInlineSnapshot(`
        ".rule1,
        .rule2 {
        } 
          .rule1-part1, .rule2-part1 {}"
      `);
    });

    it("should fully transform rules with multiple &- selectors", async () => {
      expect(
        await process(dedent`
        .rule { 
          &-part1,
          &-part2 {} 
        }`)
      ).toMatchInlineSnapshot(`
        ".rule { 
        } 
          .rule-part1,
          .rule-part2 {}"
      `);
    });

    it("should work with multiple parent selectors, and multiple &- selectors", async () => {
      expect(
        await process(dedent`
        .rule1,
        .rule2 { 
          &-part1,
          &-part2 {}
        }`)
      ).toMatchInlineSnapshot(`
        ".rule1,
        .rule2 {
        } 
          .rule1-part1,
          .rule1-part2, .rule2-part1,
          .rule2-part2 {}"
      `);
    });
  });

  describe("dollar vars", () => {
    it("should leave root variables where they are", async () => {
      expect(
        await process(dedent`
          $blue: #0000FF;

          .rule {
            color: $blue;
          }
        `)
      ).toMatchInlineSnapshot(`
        "$blue: #0000FF;

        .rule {
          color: $blue;
        }"
      `);
    });

    it("should promote duplicate variables when possible", async () => {
      expect(
        await process(dedent`
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
        "
            $blue: #0000BB;
          .rule {
          $blue: #0000FF
        }
          .rule-part1 {
          }
          .rule-part1-part2 {
              color: $blue;
            }"
      `);
    });

    it("should throw when unable to promote duplicate variables", async () => {
      expect(
        await process(dedent`
          $blue: #0000FF;

          .rule {
            $blue: #0000BB;
            &-part1 {
              color: $blue
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        "$blue: #0000FF;

        $blue: #0000BB;

        .rule {
        }

        .rule-part1 {
            color: $blue
          }"
      `);
    });

    it("should promote a variable along with dependent rules", async () => {
      expect(
        await process(dedent`
          .rule {
            $blue: #0000FF;
            
            &-part1 {
              color: $blue;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        "
          $blue: #0000FF;
        .rule {
        }
        .rule-part1 {
            color: $blue;
          }"
      `);
    });

    it("should places rules after first comments, imports and declarations", async () => {
      expect(
        await process(dedent`
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
        "/* comment*/
        @import \\"something\\";

        $var: 1;
        $blue: #0000FF;
        .rule {
        }
        .rule-part1 {
            color: $blue;
          }"
      `);
    });
  });

  it("should respect $var order dependencies", async () => {
    expect(
      await process(dedent`
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
      "/* comment*/
      @import \\"something\\";

      $var: 1;
      $blue: #0000FF;
      $light-blue: lighten($blue, 0.2);
      .rule {
      }
      .rule-part1 {
          background-color: $light-blue;
          color: $blue;
        }"
    `);
  });

  it("should respect recursive $var dependencies", async () => {
    expect(
      await process(dedent`
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
      "/* comment*/
      @import \\"something\\";

      $var: 1;
      $blue: #0000FF;
      $light-blue: lighten($blue, 0.2);
      .rule {
      }
      .rule-part1 {
          color: $light-blue;
        }"
    `);
  });
});
