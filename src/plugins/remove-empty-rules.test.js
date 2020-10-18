import { createProcessor } from "utils/postcss";
import removeEmptyRules from "./remove-empty-rules";

const process = createProcessor(removeEmptyRules());

describe("remove-empty-rules", () => {
  it("should remove an empty rule", async () => {
    expect(
      await process(`
        .rule {}
      `)
    ).toMatchInlineSnapshot(``);
  });

  it("should remove nested empty rules", async () => {
    expect(
      await process(`
        .rule {
          .inner-rule {}
        }
      `)
    ).toMatchInlineSnapshot(``);
  });

  it("should ignore rules with declarations", async () => {
    expect(
      await process(`
        .rule {
          color: #000000
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        color: #000000;
      }
    `);
  });

  it("should ignore variable declarations", async () => {
    expect(
      await process(`
        .rule {
          $var: 1;
        }
      `)
    ).toMatchInlineSnapshot(`
      .rule {
        $var: 1;
      }
    `);
  });
});
