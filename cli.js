#!/usr/bin/env node

// stripped down version of postcss-cli that allows running this directly, and enables the inline comment monkey patch
const { writeFileSync, readFileSync } = require("fs");

const postcss = require("postcss");
const postcssScss = require("postcss-scss");
require("./utils/allow-inline-comments");

// plugins
const removeDashAmpersand = require("./plugins/remove-dash-ampersand");
const removeEmptyRules = require("./plugins/remove-empty-rules");
const removeNestedUnusedDollarVars = require("./plugins/remove-nested-unused-dollar-vars");

require("yargs")
  .scriptName("scss-codemods")
  .usage("$0 <cmd> <files...>")
  .command(
    "union-class-name <files...>",
    "Promotes union class rules to the parent level to improve grepability",
    (yargs) => {
      yargs
        .option("r", {
          alias: "reorder",
          describe: "reorder promoted rules rules ",
          choices: ["no-reorder", "safe-reorder", "unsafe-reorder"],
          default: "no-reorder",
        })
        .option("p", {
          alias: "promote-dollar-vars",
          describe: "promote dollar vars to global scope",
          choices: ["no-global", "global"],
          default: "global",
        })
        .option("n", {
          alias: "namespace-dollar-vars",
          describe: "namespace promoted dollar vars",
          choices: [
            "no-namespace",
            "namespace-when-necessary",
            "namespace-always",
          ],
          default: "no-namespace",
        });
    },
    (argv) => {
      const processor = postcss([
        removeDashAmpersand({
          reorder: argv.reorder,
          promoteDollarVars: argv.promoteDollarVars,
          namespaceDollarVars: argv.namespaceDollarVars,
        }),
        removeNestedUnusedDollarVars(),
        removeEmptyRules(),
      ]);
      Promise.all(
        argv.files.map((file) => {
          const css = readFileSync(file, "utf8");
          return processor
            .process(css, {
              // always replace
              from: file,
              to: file,
              parser: postcssScss,
              map: false,
            })
            .then((result) => {
              writeFileSync(file, result.css);
              console.log(file);
            });
        })
      ).catch((error) => {
        console.trace(error);
        exit(1);
      });
    }
  )
  .demandCommand(1)
  .help().argv;
