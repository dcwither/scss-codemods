const { createProcessor } = require("../test-helpers");
const removeEmptyRules = require("./remove-nested-unused-dollar-vars");

const process = createProcessor(removeEmptyRules());

describe("remove-nested-unused-dollar-vars", () => {
  it("should remove an unused dollar decl", async () => {
    expect(
      await process(`
        .rule {
          $unused: 1;
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
      }
    `);
  });

  it("should ignore used dollar decls", async () => {
    expect(
      await process(`
        .rule {
          $used: #000000;
          color: $used;
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        $used: #000000;
        color: $used;
      }
    `);
  });

  it("should ignore dollar decls used in @ rules", async () => {
    expect(
      await process(`
        .rule {
          $used: #000000;
          @include box-shadow($used)
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        $used: #000000;
        @include box-shadow($used);
      }
    `);
  });

  it("should ignore dollar decls used in @ rules", async () => {
    expect(
      await process(`
        .rule {
          $used: name;
          .#{$used} {
            $used: not used here;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        $used: name;
        .#{$used} {
        }
      }
    `);
  });

  it("should remove unused dollar decl chains", async () => {
    expect(
      await process(`
        .rule {
          $unused-1: 1;
          $unused-2: 2 * $unused-1;
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
      }
    `);
  });

  it("should remove unused duplicate decls", async () => {
    expect(
      await process(`
      .rule {
        $parentUsed: 1;
          .part1 {
            color: $parentUsed;
            .part2 {

              $parentUsed: 2;
            }
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        $parentUsed: 1;
        .part1 {
          color: $parentUsed;
          .part2 {
          }
        }
      }
    `);
  });

  it("should remove unused duplicate decls", async () => {
    expect(
      await process(`
        .rule {
          $bothunused: 1;
          .part1 {
            $bothunused: 2;
          }
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        .part1 {
        }
      }
    `);
  });

  it("should ignore global rules even if unused", async () => {
    expect(
      await process(`
        $unused-global: 1;
      `)
    ).toMatchInlineSnapshot(`$unused-global: 1;`);
  });
});
