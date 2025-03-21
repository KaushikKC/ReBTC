const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  userAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
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
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
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
TransactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for faster queries
TransactionSchema.index({ userAddress: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
