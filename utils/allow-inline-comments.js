const Stringifier = require("postcss/lib/stringifier");

// monkey patch postcss comments to ensure they remain inline
Stringifier.prototype.comment = function (node) {
  if (node.raws.inline) {
    this.builder("// " + node.text, node);
  } else {
    let left = this.raw(node, "left", "commentLeft");
    let right = this.raw(node, "right", "commentRight");
    this.builder("/*" + left + node.text + right + "*/", node);
  }
};
