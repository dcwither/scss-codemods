const { createProcessor } = require("../utils/postcss");
const hexToTokens = require("./hex-to-tokens");

const sharedConfig = [
  {
    hex: "#000000",
    name: "$black",
  },
  {
    hex: "#020000",
    name: "$nearly-black",
  },
];

describe("hex-to-tokens", () => {
  describe("threshold: 0", () => {
    const process = createProcessor(
      hexToTokens({
        config: sharedConfig,
      })
    );

    it("should transform a hex color with exact match to mapping", async () => {
      expect(
        await process(`
          html {
            color: #000000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $black;
        }
      `);
    });

    it("should transform a multiple colors in a single value", async () => {
      expect(
        await process(`
          html {
            color: #000000 #000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $black $black;
        }
      `);
    });

    it("should match colors across hex lengths", async () => {
      expect(
        await process(`
          html {
            color: #000;
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
            color: #000001;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: #000001;
        }
      `);
    });
  });

  describe("threshold: 1", () => {
    const process = createProcessor(
      hexToTokens({
        config: sharedConfig,
        threshold: 1,
      })
    );

    it("should transform a hex color with exact match to mapping", async () => {
      expect(
        await process(`
          html {
            color: #000000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $black;
        }
      `);
    });

    it("should transform a hex color with indistinguishable difference", async () => {
      expect(
        await process(`
          html {
            color: #000002;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $black;
        }
      `);
    });

    it("should prioritize the closest color", async () => {
      expect(
        await process(`
          html {
            color: #010000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $nearly-black;
        }
      `);
    });

    it("should ignore a hex color with small difference", async () => {
      expect(
        await process(`
          html {
            color: #000003;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: #000003;
        }
      `);
    });
  });

  describe("threshold: 100", () => {
    const process = createProcessor(
      hexToTokens({
        config: sharedConfig,
        threshold: 100,
      })
    );

    it("should transform a hex color with exact match to mapping", async () => {
      expect(
        await process(`
          html {
            color: #000000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $black;
        }
      `);
    });

    it("should prioritize the closest color", async () => {
      expect(
        await process(`
          html {
            color: #010000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $nearly-black;
        }
      `);
    });

    it("should transform a hex color with any difference", async () => {
      expect(
        await process(`
          html {
            color: #FF0000;
          }
        `)
      ).toMatchInlineSnapshot(`
        html {
          color: $nearly-black;
        }
      `);
    });
  });
});
