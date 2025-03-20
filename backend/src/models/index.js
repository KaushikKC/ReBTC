// models/index.js
import { Sequelize } from "sequelize";
import ApyRatesModel from "./ApyRates";
import YieldHistoryModel from "./YieldHistory";
import TransactionModel from "./Transaction";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  }
);

// Initialize models
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Define models
db.ApyRates = ApyRatesModel(sequelize, Sequelize);
db.YieldHistory = YieldHistoryModel(sequelize, Sequelize);
db.Transaction = TransactionModel(sequelize, Sequelize);

export default db;
