const { Schema, model } = require("mongoose");

const tinyMce = Schema(
  {
    token: { type: String },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("tiny-mce", tinyMce);
