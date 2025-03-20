const express = require("express");
const router = express.Router();
const usdtAgentController = require("../controllers/agentController");

// Route to manually trigger USDT price monitoring
router.post("/monitor", usdtAgentController.triggerMonitoring);

// Route to start the cron job with custom interval and preferences
router.post("/start-monitoring", usdtAgentController.startCronJob);

// Route to stop the cron job
router.post("/stop-monitoring", usdtAgentController.stopCronJob);

module.exports = router;
