#!/usr/bin/env node
const log = require("npmlog");

// stripped down version of postcss-cli that allows running this directly, and enables the inline comment monkey patch
require("./src/utils/allow-inline-comments");

// eslint-disable-next-line no-unused-expressions
require("yargs")
  .options({
    loglevel: {
      describe: "What level of logs to report.",
      type: "string",
      default: "info",
    },
  })
  .middleware((argv) => {
    log.level = argv.loglevel;
  })
  .scriptName("scss-codemods")
  .usage("$0 <cmd> <files...>")
  .commandDir("./src/commands")
  .demandCommand(1)
  .help().argv;
