const postcss = require("postcss");
const prettier = require("prettier");

require("./utils/allow-inline-comments");

// string snaphsots should not add the string output
expect.addSnapshotSerializer({
  test: (val) => val instanceof postcss.Result,
  print: (val) => {
    return prettier
      .format(val.css, { parser: "scss" })
      .replace(/\{\s*\}/g, "{}")
      .trim();
  },
});
