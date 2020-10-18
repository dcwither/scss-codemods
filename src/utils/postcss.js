import { readFileSync, writeFileSync } from "fs";

import log from "npmlog";
import postcss from "postcss";
import postcssScss from "postcss-scss";

export const createProcessor = function createProcessor(plugins) {
  const configured = postcss(plugins);
  return (css) => {
    return configured.process(css, {
      parser: postcssScss,
      from: "CSS",
    });
  };
};

export const processFiles = function processFiles(files, process) {
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
  });
};
