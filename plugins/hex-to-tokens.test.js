const { createProcessor } = require("../utils/postcss");
const hexToTokens = require("./hex-to-tokens");

describe("hex-to-tokens", () => {
  describe("threshold: 0", () => {
    const process = createProcessor(
      hexToTokens({
        config: [
          {
            hex: "#000000",
            name: "$black",
          },
        ],
      })
    );
    it("should transform a hex color with exact match to mapping", async () => {
      expect(
        await process(`
          html {
            color: #000000
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $black;
        }
      `);
    });
    it("should ignore a hex color with indistinguishable difference", async () => {
      expect(
        await process(`
          html {
            color: #000001
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: #000001;
        }
      `);
    });
  });
});
