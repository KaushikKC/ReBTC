const express = require("express");
const profileRoutes = require("./profile");
const loanRoutes = require("./loan");
const depositRoutes = require("./deposit");
const stakeRoutes = require("./stake");
const transactionRoutes = require("./transaction");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all API routes
router.use(authenticate);

// Mount the different route modules
router.use("/profile", profileRoutes);
router.use("/loan", loanRoutes);
router.use("/deposit", depositRoutes);
router.use("/stake", stakeRoutes);
router.use("/transaction", transactionRoutes);

module.exports = router;
