const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
