import { createProcessor, processFiles } from "utils/postcss";

import hexToTokens from "plugins/hex-to-tokens";
import { readFileSync } from "fs";

export const command = "hex-to-tokens <files...>";

export const describe =
  "Replaces hex colors with their closest matched mapped tokens";

export const builder = (yargs) => {
  yargs
    .options({
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
    })
    .check((argv) => {
      if (argv.threshold < 0 || argv.threshold > 100) {
        throw new Error("tThreshold must be within the range [0, 100]");
      }
      return true;
    });
};

export const handler = (argv) => {
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
