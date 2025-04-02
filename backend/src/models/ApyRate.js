const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ApyRateSchema = new Schema({
  asset: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  rate: {
    type: Number,
    required: true,
    default: 0,
  },
  updatedBy: {
    type: String,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("ApyRate", ApyRateSchema);