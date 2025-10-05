const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const transactionSchema = Schema(
  {
    status: { type: String, default: "pending" },
    trxId: { type: String },
    currency: { type: String },
    userName: { type: String },
    email: { type: String },
    method: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    exactAmount: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creditGiven: { type: String, default: "false" },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = model("transaction", transactionSchema);
