const { writeFileSync, readFileSync } = require("fs");

const postcss = require("postcss");
const postcssScss = require("postcss-scss");
const log = require("npmlog");

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
        log.info(file);
      });
    })
  ).catch((error) => {
    log.error(error);
    exit(1);
  });
};
