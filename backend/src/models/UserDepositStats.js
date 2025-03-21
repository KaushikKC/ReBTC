const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserDepositStatsSchema = new Schema(
  {
    userAddress: {
      type: String,
      required: true,
      unique: true,
    },
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserDepositStats", UserDepositStatsSchema);
