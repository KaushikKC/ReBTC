const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RebtcRewardSchema = new Schema({
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
  source: {
    type: String,
    default: "BTC Staking",
  },
  txHash: {
    type: String,
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
RebtcRewardSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for faster queries
RebtcRewardSchema.index({ userAddress: 1, createdAt: -1 });

module.exports = mongoose.model("RebtcReward", RebtcRewardSchema);
