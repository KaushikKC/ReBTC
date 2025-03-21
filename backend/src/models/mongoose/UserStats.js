const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserStatsSchema = new Schema({
  userAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // Deposit stats
  lstBtcDepositCount: {
    type: Number,
    default: 0,
  },
  totalBtcDeposited: {
    type: Number,
    default: 0,
  },
  totalLstBtcDeposited: {
    type: Number,
    default: 0,
  },
  lastDepositDate: {
    type: Date,
  },

  // Loan stats
  flashLoanCount: {
    type: Number,
    default: 0,
  },
  totalFlashLoanAmount: {
    type: Number,
    default: 0,
  },
  lastLoanDate: {
    type: Date,
  },
  totalFeePaid: {
    type: Number,
    default: 0,
  },

  // Reward stats
  totalRebtcRewards: {
    type: Number,
    default: 0,
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
UserStatsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("UserStats", UserStatsSchema);
