const { Sequelize } = require("sequelize");
const ApyRateModel = require("./ApyRate");
const YieldHistoryModel = require("./YieldHistory");
const TransactionModel = require("./Transaction");
const UserDepositStatsModel = require("./UserDepositStats");
const UserLoanStatsModel = require("./UserLoanstats");
const DepositModel = require("./Deposite");
const LoanModel = require("./Loan");
const RebtcRewardModel = require("./ReBTCReward");

const sequelize = new Sequelize(
  process.env.DB_NAME || "rebtc_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    logging: console.log, // Temporarily enable logging to debug
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Initialize models
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Define models - make sure each model is properly initialized
db.ApyRate = ApyRateModel(sequelize, Sequelize.DataTypes);
db.YieldHistory = YieldHistoryModel(sequelize, Sequelize.DataTypes);
db.Transaction = TransactionModel(sequelize, Sequelize.DataTypes);
db.UserDepositStats = UserDepositStatsModel(sequelize, Sequelize.DataTypes);
db.UserLoanStats = UserLoanStatsModel(sequelize, Sequelize.DataTypes);
db.Deposit = DepositModel(sequelize, Sequelize.DataTypes);
db.Loan = LoanModel(sequelize, Sequelize.DataTypes);
db.RebtcReward = RebtcRewardModel(sequelize, Sequelize.DataTypes);

// Verify models are properly initialized before setting up associations
console.log(
  "Initialized models:",
  Object.keys(db).filter((key) => key !== "sequelize" && key !== "Sequelize")
);

// Only set up associations if all models are properly initialized
if (
  db.UserDepositStats &&
  db.UserDepositStats.hasMany &&
  db.Deposit &&
  db.Loan &&
  db.Transaction &&
  db.RebtcReward
) {
  console.log("Setting up associations...");

  // Define relationships
  // A user can have many deposits
  db.UserDepositStats.hasMany(db.Deposit, {
    foreignKey: "userAddress",
    sourceKey: "userAddress",
  });
  db.Deposit.belongsTo(db.UserDepositStats, {
    foreignKey: "userAddress",
    targetKey: "userAddress",
  });

  // A user can have many loans
  db.UserLoanStats.hasMany(db.Loan, {
    foreignKey: "userAddress",
    sourceKey: "userAddress",
  });
  db.Loan.belongsTo(db.UserLoanStats, {
    foreignKey: "userAddress",
    targetKey: "userAddress",
  });

  // A user can have many transactions
  db.UserDepositStats.hasMany(db.Transaction, {
    foreignKey: "userAddress",
    sourceKey: "userAddress",
  });
  db.Transaction.belongsTo(db.UserDepositStats, {
    foreignKey: "userAddress",
    targetKey: "userAddress",
  });

  // A user can have many rewards
  db.UserDepositStats.hasMany(db.RebtcReward, {
    foreignKey: "userAddress",
    sourceKey: "userAddress",
  });
  db.RebtcReward.belongsTo(db.UserDepositStats, {
    foreignKey: "userAddress",
    targetKey: "userAddress",
  });

  console.log("Associations set up successfully");
} else {
  console.error(
    "Some models are not properly initialized. Skipping associations setup."
  );
  console.log("Available models:", db);
}

module.exports = db;
