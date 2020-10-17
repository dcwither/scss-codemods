const { readFileSync } = require("fs");

const hexToTokens = require("../plugins/hex-to-tokens");
const { createProcessor, processFiles } = require("../utils/postcss");

exports.command = "hex-to-tokens <files...>";

exports.describe =
  "Replaces hex colors with their closest matched mapped tokens";

exports.builder = {
  c: {
    alias: "config",
    describe: "hex to token mapping file location",
    type: "string",
    required: true,
  },
  t: {
    alias: "threshold",
    describe: "the delta-e threshold",
    type: "number",
    default: 0,
  },
};

exports.handler = (argv) => {
  // validate inputs
  if (argv.threshold < 0 || argv.threshold > 100) {
    throw new Error("threshold must be within the range [0, 100]");
  }

  const config = JSON.parse(readFileSync(argv.config, "utf8"));
  processFiles(
    argv.files,
    createProcessor([
      hexToTokens({
        config: config,
        threshold: argv.threshold,
      }),
    ])
  );
};
