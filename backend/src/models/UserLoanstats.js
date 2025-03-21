const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * UserLoanStats Schema
 * Tracks statistics about a user's flash loans and related activities
 */
const UserLoanStatsSchema = new Schema(
  {
    userAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    flashLoanCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalFlashLoanAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    lastLoanDate: {
      type: Date,
      default: null,
    },
    totalFeePaid: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Add methods to the schema if needed
UserLoanStatsSchema.methods.incrementFlashLoanCount = function (amount = 1) {
  this.flashLoanCount += amount;
  return this.save();
};

UserLoanStatsSchema.methods.addFlashLoanAmount = function (amount) {
  this.totalFlashLoanAmount += amount;
  this.lastLoanDate = new Date();
  return this.save();
};

UserLoanStatsSchema.methods.addFeePaid = function (fee) {
  this.totalFeePaid += fee;
  return this.save();
};

// Static methods for finding or creating user stats
UserLoanStatsSchema.statics.findOrCreateByAddress = async function (
  userAddress
) {
  let stats = await this.findOne({ userAddress: userAddress.toLowerCase() });

  if (!stats) {
    stats = new this({
      userAddress: userAddress.toLowerCase(),
      flashLoanCount: 0,
      totalFlashLoanAmount: 0,
      totalFeePaid: 0,
    });
    await stats.save();
  }

  return stats;
};

// Create and export the model
const UserLoanStats = mongoose.model("UserLoanStats", UserLoanStatsSchema);

module.exports = UserLoanStats;
