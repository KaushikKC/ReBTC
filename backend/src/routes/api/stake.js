const express = require("express");
const router = express.Router();

// Import the stake controller
const stakeController = require("../../controllers/stakeController");

// Define a simple fallback handler for undefined routes
const notImplemented = (req, res) => {
  res.status(501).json({ error: "This endpoint is not yet implemented" });
};

// Process a new stake
router.post("/", stakeController.processStake || notImplemented);

// Process rewards
router.post("/rewards", stakeController.processRewards || notImplemented);

// Get user stakes
router.get("/", stakeController.getUserStakes || notImplemented);

// Get user rewards
router.get("/rewards", stakeController.getUserRewards || notImplemented);

module.exports = router;
