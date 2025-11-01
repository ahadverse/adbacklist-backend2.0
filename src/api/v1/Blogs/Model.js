const { Schema, model } = require("mongoose");

const blogSchema = Schema(
  {
    title: { type: String, trim: true },
    permalink: { type: String, trim: true },
    metaKey: { type: String, trim: true },
    metaDesc: { type: String, trim: true },
    category: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    desc: { type: String },
    status: { type: String, default: "published" },
    image: { type: String },
    writer: { type: String },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

blogSchema.index({ createdAt: -1 });

module.exports = model("blogs", blogSchema);
