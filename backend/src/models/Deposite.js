const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DepositSchema = new Schema({
  userAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  asset: {
    type: String,
    required: true,
    index: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  type: {
    type: String,
    default: "Deposit",
  },
  apy: {
    type: Number,
  },
  withdrawalTxHash: {
    type: String,
  },
  withdrawalDate: {
    type: Date,
  },
  details: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
DepositSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Deposit", DepositSchema);
