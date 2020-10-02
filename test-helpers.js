const postcss = require("postcss");
const postcssScss = require("postcss-scss");
const prettier = require("prettier");

// string snaphsots should not add the string output
expect.addSnapshotSerializer({
  test: (val) => typeof val === "string",
  print: (val) => {
    return val.trim();
  },
});

function createProcessor(plugin) {
  const configured = postcss([plugin()]);
  return async (css) => {
    const result = await configured.process(css, {
      parser: postcssScss,
      from: "CSS",
    });

    return prettier.format(result.css, { parser: "scss" });
  };
}

module.exports = {
  createProcessor,
};
