const express = require("express");
const router = express.Router();

// Import the deposit controller
const depositController = require("../../controllers/depositController");

// Define a simple fallback handler for undefined routes
const notImplemented = (req, res) => {
  res.status(501).json({ error: "This endpoint is not yet implemented" });
};

// Process a new deposit
router.post("/", depositController.processDeposit || notImplemented);

// Get user deposits
router.get("/:address", depositController.getUserDeposits || notImplemented);

// Get deposit stats
router.get("/stats", depositController.getDepositStats || notImplemented);

module.exports = router;
