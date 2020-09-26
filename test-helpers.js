const postcss = require("postcss");
const postcssScss = require("postcss-scss");

function createProcessor(plugin) {
  const configured = postcss([plugin()]);
  return async (css) => {
    const result = await configured.process(css, {
      parser: postcssScss,
      from: "CSS",
    });

    return result.css;
  };
}

module.exports = {
  createProcessor,
};
