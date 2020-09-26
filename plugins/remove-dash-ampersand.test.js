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
            &-extension {}
          }
        `)
      ).toMatchInlineSnapshot(`
        ".rule {
        } 
          .rule-extension {}"
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

    it("should promote a variable along with dependent rules", async () => {
      expect(
        await process(dedent`
          .rule {
            $blue: #0000FF;
            
            &-extension {
              color: $blue;
            }
          }
        `)
      ).toMatchInlineSnapshot(`
        "
          $blue: #0000FF;
        .rule {
        }
        .rule-extension {
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
            
            &-extension {
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
        .rule-extension {
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
          
          &-extension {
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
      .rule-extension {
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
          
          &-extension {
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
      .rule-extension {
          color: $light-blue;
        }"
    `);
  });
});
