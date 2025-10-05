const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const postSchema = Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    category: { type: String },
    premiumDay: { type: Number },
    subCategory: { type: String },
    description: { type: String },
    city: { type: String },
    status: { type: String },
    link: { type: String },
    age: { type: String },
    cities: { type: Array },
    images: { type: Array },
    isApproved: { type: Boolean, default: false },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDelete: { type: Boolean, default: false },
    isPremium: { type: Boolean },
  },
  { timestamps: true }
);

module.exports = model("post", postSchema);
