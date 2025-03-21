const { ethers } = require("ethers");
const {
  Deposit,
  Transaction,
  UserStats,
  ApyRate,
} = require("../models/mongoose");
const { getProvider } = require("../utils/web3");

// Import contract addresses and ABIs
const {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  DEPOSIT_CONTRACT_ADDRESS,
  TOKEN_ABI,
  DEPOSIT_CONTRACT_ABI,
} = require("../constants/contracts");

// Process a new deposit
exports.processDeposit = async (req, res) => {
  try {
    const { address } = req.user;
    const { amount, asset, txHash, apy } = req.body;

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
    const deposit = await Deposit.create({
      userAddress: address,
      amount: parseFloat(amount),
      asset,
      txHash,
      status: "Completed",
      apy: apy || null,
    });

    // Create transaction record
    await Transaction.create({
      userAddress: address,
      txHash,
      type: "Deposit",
      amount: parseFloat(amount),
      asset,
      status: "Completed",
    });

    // Update user stats
    await UserStats.findOneAndUpdate(
      { userAddress: address },
      {
        $inc: {
          ...(asset.toLowerCase() === "rebtc" ||
          asset.toLowerCase() === "lstbtc"
            ? {
                lstBtcDepositCount: 1,
                totalLstBtcDeposited: parseFloat(amount),
              }
            : asset.toLowerCase() === "btc"
            ? { totalBtcDeposited: parseFloat(amount) }
            : {}),
        },
        $set: { lastDepositDate: new Date() },
      },
      { new: true, upsert: true }
    );

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
exports.getUserDeposits = async (req, res) => {
  try {
    const { address } = req.user;
    const { limit = 10, offset = 0, asset } = req.query;

    // Build query conditions
    const query = { userAddress: address };

    if (asset) {
      query.asset = asset;
    }

    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Deposit.countDocuments(query);

    res.status(200).json({
      deposits,
      totalCount,
      page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
};

// Get deposit stats
exports.getDepositStats = async (req, res) => {
  try {
    const { address } = req.user;

    // Get user deposit stats
    const userStats = (await UserStats.findOne({ userAddress: address })) || {
      totalBtcDeposited: 0,
      totalLstBtcDeposited: 0,
      lstBtcDepositCount: 0,
      lastDepositDate: null,
    };

    // Get deposit distribution by asset
    const assetDistribution = await Deposit.aggregate([
      { $match: { userAddress: address } },
      {
        $group: {
          _id: "$asset",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          asset: "$_id",
          count: 1,
          totalAmount: 1,
        },
      },
    ]);

    // Get current APY rates
    const apyRates = await ApyRate.find();

    // Map asset distribution with current APY
    const assetsWithApy = assetDistribution.map((asset) => {
      const currentApy =
        apyRates.find((rate) => rate.asset === asset.asset)?.rate || 0;
      return {
        ...asset,
        currentApy,
      };
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
        .then((bal) => ethers.utils.formatUnits(bal, 8))
        .catch(() => "0"),
      lstBtcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatUnits(bal, 8))
        .catch(() => "0"),
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
      assetDistribution: assetsWithApy,
    });
  } catch (error) {
    console.error("Error fetching deposit stats:", error);
    res.status(500).json({ error: "Failed to fetch deposit stats" });
  }
};
