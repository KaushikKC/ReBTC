const express = require("express");
const router = express.Router();

// Import the loan controller
const loanController = require("../../controllers/LoanController");

// Define a simple fallback handler for undefined routes
const notImplemented = (req, res) => {
  res.status(501).json({ error: "This endpoint is not yet implemented" });
};

// Process a new flash loan
router.post("/flash", loanController.processFlashLoan || notImplemented);

// Get active loans count
router.get("/count", loanController.getActiveLoansCount || notImplemented);

// Get loan history
router.get("/history", loanController.getLoanHistory || notImplemented);

// Get loan stats
router.get("/stats", loanController.getLoanStats || notImplemented);

module.exports = router;
