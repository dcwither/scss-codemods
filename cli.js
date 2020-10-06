#!/usr/bin/env node

// stripped down version of postcss-cli that allows running this directly, and enables the inline comment monkey patch
const { writeFileSync, readFileSync } = require("fs");

const postcss = require("postcss");
require("./utils/allow-inline-comments");
const config = require("./postcss.config.js");
const processor = postcss(config.plugins);

const argv = require("minimist")(process.argv.slice(2));
const [command, ...files] = argv._;

let tasks = [];
switch (command) {
  case "union-class-name":
    tasks = files.map((file) => {
      const css = readFileSync(file, "utf8");
      return processor
        .process(css, {
          // always replace
          from: file,
          to: file,
          parser: config.parser,
          map: false,
        })
        .then((result) => {
          writeFileSync(file, result.css);
          console.log(file);
        });
    });
  default:
    console.log(
      "sorry, right now we only have one command - unwind-nested-union-classsname :)"
    );
}

Promise.all(tasks).catch((error) => {
  console.trace(error);
  exit(1);
});
