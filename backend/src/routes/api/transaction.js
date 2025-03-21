const express = require("express");
const router = express.Router();

// Import the transaction controller
const transactionController = require("../../controllers/TransactionController");

// Define a simple fallback handler for undefined routes
const notImplemented = (req, res) => {
  res.status(501).json({ error: "This endpoint is not yet implemented" });
};

// Record a new transaction
router.post("/", transactionController.recordTransaction || notImplemented);

// Get transaction history
router.get(
  "/history",
  transactionController.getTransactionHistory || notImplemented
);

// Get transaction stats
router.get(
  "/stats",
  transactionController.getTransactionStats || notImplemented
);

module.exports = router;
