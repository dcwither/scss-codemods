const postcss = require("postcss");
const postcssScss = require("postcss-scss");
const prettier = require("prettier");

require("./utils/allow-inline-comments");

// string snaphsots should not add the string output
expect.addSnapshotSerializer({
  test: (val) => val instanceof postcss.Result,
  print: (val) => {
    return prettier.format(val.css, { parser: "scss" }).trim();
  },
});

function createProcessor(plugin) {
  const configured = postcss([plugin]);
  return (css) => {
    return configured.process(css, {
      parser: postcssScss,
      from: "CSS",
    });
  };
}

module.exports = {
  createProcessor,
};
