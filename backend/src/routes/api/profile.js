import express from "express";
import {
  getUserProfile,
  getUserDeposits,
  getYieldBreakdown,
  getActiveLoans,
  getTransactionHistory,
  getLstBtcDepositCount,
  updateLstBtcDepositCount,
  getActiveLoansCount,
  getDepositAssets,
  getRebtcRewards,
} from "../../controllers/profileController";

const router = express.Router();

// Get all profile data in one request
router.get("/", getUserProfile);

// Individual endpoints for specific sections
router.get("/deposits", getUserDeposits);
router.get("/yield", getYieldBreakdown);
router.get("/loans", getActiveLoans);
router.get("/transactions", getTransactionHistory);

// New count-specific endpoints
router.get("/lstbtc-count", getLstBtcDepositCount);
router.post("/lstbtc-count", updateLstBtcDepositCount);
router.get("/active-loans-count", getActiveLoansCount);
router.get("/deposit-assets", getDepositAssets);
router.get("/rebtc-rewards", getRebtcRewards);

export default router;
