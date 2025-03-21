const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LoanSchema = new Schema({
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
  fee: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  type: {
    type: String,
    enum: ["Flash", "Term", "Collateralized"],
    default: "Flash",
  },
  repaid: {
    type: Boolean,
    default: false,
  },
  repaymentTxHash: {
    type: String,
  },
  repaymentDate: {
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
LoanSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Loan", LoanSchema);
