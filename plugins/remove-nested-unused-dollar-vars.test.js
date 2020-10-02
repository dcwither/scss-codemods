const { createProcessor } = require("../test-helpers");
const dedent = require("dedent-js");
const removeEmptyRules = require("./remove-nested-unused-dollar-vars");

const process = createProcessor(removeEmptyRules);

describe("remove-nested-unused-dollar-vars", () => {
  it("should remove an unused dollar decl", async () => {
    expect(
      await process(dedent`
        .rule {
          $unused: 1;
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
      }"
    `);
  });

  it("should ignore used dollar decls", async () => {
    expect(
      await process(dedent`
        .rule {
          $used: #000000;
          color: $used;
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
        $used: #000000;
        color: $used;
      }"
    `);
  });

  it("should ignore dollar decls used in @ rules", async () => {
    expect(
      await process(dedent`
        .rule {
          $used: #000000;
          @include box-shadow($used)
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
        $used: #000000;
        @include box-shadow($used)
      }"
    `);
  });

  it("should ignore dollar decls used in @ rules", async () => {
    expect(
      await process(dedent`
        .rule {
          $used: name;
          .#{$used} {
            $used: not used here;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
        $used: name;
        .#{$used} {
        }
      }"
    `);
  });

  it("should remove unused dollar decl chains", async () => {
    expect(
      await process(dedent`
        .rule {
          $unused-1: 1;
          $unused-2: 2 * $unused-1;
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
      }"
    `);
  });

  it("should remove unused duplicate decls", async () => {
    expect(
      await process(dedent`
      .rule {
        $rootused: 1;
          .part1 {
            color: $rootused;
            .part2 {

              $rootused: 2;
            }
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
        $rootused: 1;
          .part1 {
            color: $rootused;
            .part2 {
            }
          }
        }"
    `);
  });

  it("should remove unused duplicate decls", async () => {
    expect(
      await process(dedent`
        .rule {
          $bothunused: 1;
          .part1 {
            $bothunused: 2;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      ".rule {
        .part1 {
        }
      }"
    `);
  });

  it("should ignore global rules even if unused", async () => {
    expect(
      await process(dedent`
        $unused-global: 1;
        .rule {
          $unused-1: used;
          $unused-2: 2 * $unused-1
        }
      `)
    ).toMatchInlineSnapshot(`
      "$unused-global: 1;
      .rule {
      }"
    `);
  });
});
