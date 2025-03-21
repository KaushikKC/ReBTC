const { ethers } = require("ethers");
const db = require("../models");
const { getProvider } = require("../utils/web3");
const { incrementLstBtcDepositCount } = require("./profileController");

// Import contract addresses and ABIs
const {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  REBTC_TOKEN_ADDRESS,
  STAKING_CONTRACT_ADDRESS,
  TOKEN_ABI,
  STAKING_CONTRACT_ABI,
} = require("../constants/contracts");

// Process a new stake
exports.processStake = async (req, res) => {
  try {
    const { address } = req.user;
    const { amount, txHash } = req.body;

    if (!amount || !txHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate transaction on blockchain
    const provider = getProvider();
    const tx = await provider.getTransaction(txHash);

    if (!tx || tx.from.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "Invalid transaction" });
    }

    // Create stake record
    const stake = await db.Deposit.create({
      userAddress: address,
      amount: parseFloat(amount),
      asset: "BTC",
      txHash,
      status: "Completed",
      type: "Stake",
    });

    // Increment lstBTC deposit count
    await incrementLstBtcDepositCount(address, 1);

    // Update user deposit stats
    const [userStats] = await db.UserDepositStats.findOrCreate({
      where: { userAddress: address },
      defaults: { userAddress: address },
    });

    userStats.totalBtcDeposited += parseFloat(amount);
    userStats.lastDepositDate = new Date();
    await userStats.save();

    res.status(201).json({
      success: true,
      stake,
      message: "Stake processed successfully",
    });
  } catch (error) {
    console.error("Error processing stake:", error);
    res.status(500).json({ error: "Failed to process stake" });
  }
};

// Process ReBTC rewards
exports.processRewards = async (req, res) => {
  try {
    const { address } = req.user;
    const { amount, txHash } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create reward record
    const reward = await db.RebtcReward.create({
      userAddress: address,
      amount: parseFloat(amount),
      source: "BTC Staking",
      txHash,
    });

    res.status(201).json({
      success: true,
      reward,
      message: "Reward processed successfully",
    });
  } catch (error) {
    console.error("Error processing reward:", error);
    res.status(500).json({ error: "Failed to process reward" });
  }
};

// Get user stakes
exports.getUserStakes = async (req, res) => {
  try {
    const { address } = req.user;

    const stakes = await db.Deposit.findAll({
      where: {
        userAddress: address,
        type: "Stake",
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ stakes });
  } catch (error) {
    console.error("Error fetching stakes:", error);
    res.status(500).json({ error: "Failed to fetch stakes" });
  }
};

// Get user rewards
exports.getUserRewards = async (req, res) => {
  try {
    const { address } = req.user;

    const rewards = await db.RebtcReward.findAll({
      where: { userAddress: address },
      order: [["createdAt", "DESC"]],
    });

    // Get current ReBTC balance
    const provider = getProvider();
    const rebtcTokenContract = new ethers.Contract(
      REBTC_TOKEN_ADDRESS,
      TOKEN_ABI,
      provider
    );

    const rebtcBalance = await rebtcTokenContract
      .balanceOf(address)
      .then((bal) => ethers.utils.formatUnits(bal, 8));

    // Calculate total rewards
    const totalRewards = rewards.reduce(
      (sum, reward) => sum + parseFloat(reward.amount),
      0
    );

    res.status(200).json({
      rewards,
      currentBalance: parseFloat(rebtcBalance),
      totalRewards,
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
};
