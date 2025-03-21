// models/mongoose/index.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);

// Initialize models object
const models = {};

// Import models from parent directory
const User = require("../userModel");
const Deposit = require("../Deposite");
const Loan = require("../Loan");
const UserDepositStats = require("../UserDepositStats");
const Transaction = require("../Transaction");
const ApyRate = require("../ApyRate");
const RebtcReward = require("../ReBTCReward");

// Add parent directory models
models.User = User;
models.Deposit = Deposit;
models.Loan = Loan;
models.UserDepositStats = UserDepositStats;
models.Transaction = Transaction;
models.ApyRate = ApyRate;
models.RebtcReward = RebtcReward;

// Read all model files in the current directory and import them
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    try {
      const model = require(path.join(__dirname, file));
      models[model.modelName] = model;
      console.log(
        `Loaded mongoose model: ${model.modelName} from file: ${file}`
      );
    } catch (error) {
      console.error(`Error loading mongoose model from file ${file}:`, error);
    }
  });

// Log all loaded models
console.log("Loaded mongoose models:", Object.keys(models));

module.exports = models;
