import './utils/allow-inline-comments';

import log from 'npmlog';
import yargs from 'yargs';

// eslint-disable-next-line no-unused-expressions
yargs(process.argv.slice(2))
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
  .commandDir("./commands")
  .demandCommand(1)
  .help().argv;
