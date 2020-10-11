const Stringifier = require("postcss/lib/stringifier");

// monkey patch postcss comments to ensure they remain inline
Stringifier.prototype.comment = function (node) {
  let left = this.raw(node, "left", "commentLeft");
  let right = this.raw(node, "right", "commentRight");
  if (node.raws.inline) {
    this.builder("//" + left + (node.raws.text || "") + right, node);
  } else {
    this.builder("/*" + left + node.text + right + "*/", node);
  }
};
