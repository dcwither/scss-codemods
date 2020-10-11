#!/usr/bin/env node

// stripped down version of postcss-cli that allows running this directly, and enables the inline comment monkey patch

require("./utils/allow-inline-comments");

// plugins

require("yargs")
  .scriptName("scss-codemods")
  .usage("$0 <cmd> <files...>")
  .commandDir("commands")
  .demandCommand(1)
  .help().argv;
