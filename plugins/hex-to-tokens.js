module.exports = (opts) => {
  opts = {
    // default values
    threshold: 0,
    ...opts,
  };

  function mapColorsInString(str) {
    return str.replace(
      /#[0-9a-f][0-9a-f][0-9a-f]([0-9a-f][0-9a-f][0-9a-f])?/gi,
      (match) => {
        // TODO: if performance is an issue, can transform to a map
        if (opts.threshold === 0) {
          const mapping = opts.config.find(({ hex }) => {
            return hex.toLowerCase() === match.toLowerCase();
          });
          if (mapping) {
            return mapping.name;
          }
        }

        return match;
      }
    );
  }

  return {
    postcssPlugin: "hex-to-tokens",
    Declaration(decl) {
      decl.value = mapColorsInString(decl.value);
    },
  };
};
