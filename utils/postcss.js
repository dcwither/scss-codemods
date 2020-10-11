const { writeFileSync, readFileSync } = require("fs");

const postcss = require("postcss");
const postcssScss = require("postcss-scss");

exports.createProcessor = function createProcessor(plugins) {
  const configured = postcss(plugins);
  return (css) => {
    return configured.process(css, {
      parser: postcssScss,
      from: "CSS",
    });
  };
};

exports.processFiles = function processFiles(files, process) {
  return Promise.all(
    files.map((file) => {
      const css = readFileSync(file, "utf8");
      return process(css).then((result) => {
        writeFileSync(file, result.css);
        console.log(file);
      });
    })
  ).catch((error) => {
    console.trace(error);
    exit(1);
  });
};
