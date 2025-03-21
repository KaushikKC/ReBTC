const express = require("express");
const router = express.Router();

// Import the profile controller
const profileController = require("../../controllers/profileController");

// Define a simple fallback handler for undefined routes
const notImplemented = (req, res) => {
  res.status(501).json({ error: "This endpoint is not yet implemented" });
};

// Get all profile data in one request
router.get("/", profileController.getUserProfile || notImplemented);

// Individual endpoints for specific sections
router.get("/deposits", profileController.getUserDeposits || notImplemented);
router.get("/yield", profileController.getYieldBreakdown || notImplemented);
router.get("/loans", profileController.getActiveLoans || notImplemented);
router.get("/transactions", profileController.getTransactionHistory || notImplemented);

// Count-specific endpoints
router.get("/lstbtc-count", profileController.getLstBtcDepositCount || notImplemented);
router.post("/lstbtc-count", profileController.updateLstBtcDepositCount || notImplemented);
router.get("/active-loans-count", profileController.getActiveLoansCount || notImplemented);
router.get("/deposit-assets", profileController.getDepositAssets || notImplemented);
router.get("/rebtc-rewards", profileController.getRebtcRewards || notImplemented);

module.exports = router;
