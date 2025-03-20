// controllers/depositController.js
import { ethers } from "ethers";
import db from "../models";
import { getProvider } from "../utils/web3";
import { incrementLstBtcDepositCount } from "./profileController";

// Import contract addresses and ABIs
import {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  DEPOSIT_CONTRACT_ADDRESS,
  TOKEN_ABI,
  DEPOSIT_CONTRACT_ABI,
} from "../constants/contracts";

// Process a new deposit
export const processDeposit = async (req, res) => {
  try {
    const { address } = req.user;
    const { amount, asset, txHash } = req.body;

    if (!amount || !asset || !txHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate transaction on blockchain
    const provider = getProvider();
    const tx = await provider.getTransaction(txHash);

    if (!tx || tx.from.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "Invalid transaction" });
    }

    // Create deposit record
    const deposit = await db.Deposit.create({
      userAddress: address,
      amount: parseFloat(amount),
      asset,
      txHash,
      status: "Completed",
    });

    // If this is an lstBTC deposit, increment the deposit count
    if (asset.toLowerCase() === "rebtc" || asset.toLowerCase() === "lstbtc") {
      await incrementLstBtcDepositCount(address, 1);

      // Update user deposit stats
      const [userStats] = await db.UserDepositStats.findOrCreate({
        where: { userAddress: address },
        defaults: { userAddress: address },
      });

      userStats.totalLstBtcDeposited += parseFloat(amount);
      userStats.lastDepositDate = new Date();
      await userStats.save();
    } else if (asset.toLowerCase() === "btc") {
      // Update BTC deposit stats
      const [userStats] = await db.UserDepositStats.findOrCreate({
        where: { userAddress: address },
        defaults: { userAddress: address },
      });

      userStats.totalBtcDeposited += parseFloat(amount);
      userStats.lastDepositDate = new Date();
      await userStats.save();
    }

    res.status(201).json({
      success: true,
      deposit,
      message: "Deposit processed successfully",
    });
  } catch (error) {
    console.error("Error processing deposit:", error);
    res.status(500).json({ error: "Failed to process deposit" });
  }
};

// Get user deposits
export const getUserDeposits = async (req, res) => {
  try {
    const { address } = req.user;

    const deposits = await db.Deposit.findAll({
      where: { userAddress: address },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ deposits });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
};

// Get deposit stats
export const getDepositStats = async (req, res) => {
  try {
    const { address } = req.user;

    // Get user deposit stats
    const [userStats] = await db.UserDepositStats.findOrCreate({
      where: { userAddress: address },
      defaults: { userAddress: address },
    });

    // Get on-chain balances
    const provider = getProvider();
    const btcTokenContract = new ethers.Contract(
      BTC_TOKEN_ADDRESS,
      TOKEN_ABI,
      provider
    );
    const lstBtcTokenContract = new ethers.Contract(
      LSTBTC_TOKEN_ADDRESS,
      TOKEN_ABI,
      provider
    );

    const [btcBalance, lstBtcBalance] = await Promise.all([
      btcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatEther(bal)),
      lstBtcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatEther(bal)),
    ]);

    res.status(200).json({
      currentBalances: {
        btc: parseFloat(btcBalance),
        lstBtc: parseFloat(lstBtcBalance),
      },
      depositStats: {
        totalBtcDeposited: userStats.totalBtcDeposited,
        totalLstBtcDeposited: userStats.totalLstBtcDeposited,
        lstBtcDepositCount: userStats.lstBtcDepositCount,
        lastDepositDate: userStats.lastDepositDate,
      },
    });
  } catch (error) {
    console.error("Error fetching deposit stats:", error);
    res.status(500).json({ error: "Failed to fetch deposit stats" });
  }
};
