const convert = require("color-convert");
const DeltaE = require("delta-e");

function hexToLab(hexColor) {
  const [L, A, B] = convert.hex.lab.raw(hexColor.substr(1));
  return { L, A, B };
}

function withinEpsilon(num, epsilon = Number.EPSILON) {
  return Math.abs(num) < epsilon;
}

module.exports = (opts) => {
  opts = {
    // default values
    threshold: 0,
    ...opts,
  };

  const mappings = opts.config.map((mapping) => ({
    ...mapping,
    lab: hexToLab(mapping.hex),
  }));

  function mapHexColorToBestMatch(hexColor) {
    const labColor = hexToLab(hexColor);
    let lowestDeltaE = 100;
    let bestMatch = null;
    for (const mapping of mappings) {
      const deltaE = Number(DeltaE.getDeltaE00(mapping.lab, labColor)).toFixed(
        5
      );
      if (lowestDeltaE > deltaE) {
        lowestDeltaE = deltaE;
        bestMatch = mapping;
      }
    }
    // http://zschuessler.github.io/DeltaE/learn/
    if (
      lowestDeltaE < opts.threshold ||
      withinEpsilon(lowestDeltaE - opts.threshold)
    ) {
      return bestMatch.name;
    } else {
      return hexColor;
    }
  }

  function mapColorsInString(str) {
    return str.replace(
      /#[0-9a-f][0-9a-f][0-9a-f]([0-9a-f][0-9a-f][0-9a-f])?/gi,
      (match) => {
        // TODO: if performance is an issue, can transform to a map

        return mapHexColorToBestMatch(match);

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
