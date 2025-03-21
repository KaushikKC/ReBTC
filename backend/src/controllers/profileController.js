// controllers/profileController.js
const { ethers } = require("ethers");
const mongoose = require("mongoose");
const {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  LOAN_CONTRACT_ADDRESS,
  TOKEN_ABI,
  LOAN_CONTRACT_ABI,
} = require("../constants/contracts");
const { getProvider } = require("../utils/web3");

// Define UserDepositStats model directly if import fails
let UserDepositStats;
let YieldHistory;
let Transaction;

try {
  // Try to import from mongoose models
  const mongooseModels = require("../models/mongoose");
  UserDepositStats = mongooseModels.UserDepositStats;
  YieldHistory = mongooseModels.YieldHistory;
  Transaction = mongooseModels.Transaction;

  console.log("Successfully imported mongoose models");
} catch (error) {
  console.error(
    "Error importing mongoose models, defining them directly:",
    error
  );

  // Define models directly if import fails
  const UserDepositStatsSchema = new mongoose.Schema(
    {
      userAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      lstBtcDepositCount: {
        type: Number,
        required: true,
        default: 0,
      },
      totalBtcDeposited: {
        type: Number,
        required: true,
        default: 0,
      },
      totalLstBtcDeposited: {
        type: Number,
        required: true,
        default: 0,
      },
      lastDepositDate: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

  const YieldHistorySchema = new mongoose.Schema(
    {
      userAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      type: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

  const TransactionSchema = new mongoose.Schema(
    {
      userAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      txHash: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      asset: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: "Completed",
      },
      reBtcAmount: Number,
      stablecoinAmount: Number,
      stablecoinType: String,
    },
    {
      timestamps: true,
    }
  );

  // Create models if they don't exist
  UserDepositStats =
    mongoose.models.UserDepositStats ||
    mongoose.model("UserDepositStats", UserDepositStatsSchema);
  YieldHistory =
    mongoose.models.YieldHistory ||
    mongoose.model("YieldHistory", YieldHistorySchema);
  Transaction =
    mongoose.models.Transaction ||
    mongoose.model("Transaction", TransactionSchema);
}

// Get user profile complete data
exports.getUserProfile = async (req, res) => {
  try {
    const { address } = req.user;

    // Get data from database or blockchain
    const [userStats, deposits, yieldBreakdown, activeLoans, transactions] =
      await Promise.all([
        getUserStats(address),
        getUserDepositsData(address),
        getUserYieldData(address),
        getUserLoansData(address),
        getUserTransactionsData(address),
      ]);

    res.status(200).json({
      userStats,
      deposits,
      yieldBreakdown,
      activeLoans,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
};

// Get user deposits only
exports.getUserDeposits = async (req, res) => {
  try {
    const { address } = req.user;
    const deposits = await getUserDepositsData(address);
    res.status(200).json({ deposits });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ error: "Failed to fetch deposits data" });
  }
};

// Get yield breakdown only
exports.getYieldBreakdown = async (req, res) => {
  try {
    const { address } = req.user;
    const yieldBreakdown = await getUserYieldData(address);
    res.status(200).json({ yieldBreakdown });
  } catch (error) {
    console.error("Error fetching yield data:", error);
    res.status(500).json({ error: "Failed to fetch yield data" });
  }
};

// Get active loans only
exports.getActiveLoans = async (req, res) => {
  try {
    const { address } = req.user;
    const activeLoans = await getUserLoansData(address);
    res.status(200).json({ activeLoans });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans data" });
  }
};

// Get transaction history only
exports.getTransactionHistory = async (req, res) => {
  try {
    const { address } = req.user;
    const transactions = await getUserTransactionsData(address);
    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
};

// Get lstBTC deposit count
exports.getLstBtcDepositCount = async (req, res) => {
  try {
    const { address } = req.user || req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const count = await getUserLstBtcDepositCount(address);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching lstBTC deposit count:", error);
    res.status(500).json({ error: "Failed to fetch lstBTC deposit count" });
  }
};

// Update lstBTC deposit count
exports.updateLstBtcDepositCount = async (req, res) => {
  try {
    const { amount, address } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    console.log(
      "Incrementing lstBTC deposit count for address:",
      address,
      "by amount:",
      amount
    );

    const newCount = await incrementLstBtcDepositCount(
      address,
      parseFloat(amount)
    );

    console.log("New count:", newCount);

    res.status(200).json({ success: true, count: newCount });
  } catch (error) {
    console.error("Error updating lstBTC deposit count:", error);
    res.status(500).json({ error: "Failed to update lstBTC deposit count" });
  }
};

// Helper functions to fetch data
async function getUserStats(address) {
  // Initialize provider and contracts
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
  const loanContract = new ethers.Contract(
    LOAN_CONTRACT_ADDRESS,
    LOAN_CONTRACT_ABI,
    provider
  );

  try {
    // Get on-chain data
    const [
      btcBalance,
      lstBtcBalance,
      activeLoanAmount,
      insuranceStatus,
      lstBtcDepositCount,
    ] = await Promise.all([
      btcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatEther(bal))
        .catch(() => "0"),
      lstBtcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatEther(bal))
        .catch(() => "0"),
      loanContract
        .getUserActiveLoanAmount(address)
        .then((amount) => ethers.utils.formatUnits(amount, 6))
        .catch(() => "0"),
      loanContract.hasInsurance(address).catch(() => false),
      getUserLstBtcDepositCount(address),
    ]);

    // Get total earnings from MongoDB
    let totalEarnings = 0;
    try {
      const yieldData = await YieldHistory.aggregate([
        { $match: { userAddress: address.toLowerCase() } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      totalEarnings = yieldData.length > 0 ? yieldData[0].total : 0;
    } catch (error) {
      console.error("Error getting yield data:", error);
    }

    // Calculate total deposited (BTC + LstBTC)
    const totalDeposited = parseFloat(btcBalance) + parseFloat(lstBtcBalance);

    return {
      totalDeposited: parseFloat(totalDeposited.toFixed(8)),
      totalEarnings: parseFloat(totalEarnings.toFixed(8)) || 0,
      activeLoans: parseFloat(activeLoanAmount),
      insuranceStatus,
      lstBtcDepositCount,
    };
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return {
      totalDeposited: 0,
      totalEarnings: 0,
      activeLoans: 0,
      insuranceStatus: false,
      lstBtcDepositCount: 0,
    };
  }
}

async function getUserDepositsData(address) {
  // Initialize provider and contracts
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

  try {
    // Get APY rates from database or other source
    // For MongoDB, we need to adjust this query
    const apyRates = [
      { asset: "BTC", rate: 4.5 },
      { asset: "ReBTC", rate: 7.2 },
    ]; // Default values

    const btcApy = 4.5; // Default value
    const reBtcApy = 7.2; // Default value

    // Get on-chain data
    const [btcBalance, lstBtcBalance, lstBtcDepositCount] = await Promise.all([
      btcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatEther(bal))
        .catch(() => "0"),
      lstBtcTokenContract
        .balanceOf(address)
        .then((bal) => ethers.utils.formatEther(bal))
        .catch(() => "0"),
      getUserLstBtcDepositCount(address),
    ]);

    return [
      {
        asset: "BTC",
        amount: parseFloat(btcBalance),
        apy: btcApy,
        status: parseFloat(btcBalance) > 0 ? "Active" : "Inactive",
      },
      {
        asset: "ReBTC",
        amount: parseFloat(lstBtcBalance),
        apy: reBtcApy,
        status: parseFloat(lstBtcBalance) > 0 ? "Active" : "Inactive",
        depositCount: lstBtcDepositCount,
      },
    ];
  } catch (error) {
    console.error("Error in getUserDepositsData:", error);
    return [];
  }
}

async function getUserYieldData(address) {
  try {
    // Get yield data from MongoDB
    if (!YieldHistory) {
      console.error("YieldHistory model is not defined");
      return [];
    }

    const yieldData = await YieldHistory.aggregate([
      { $match: { userAddress: address.toLowerCase() } },
      { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } },
    ]);

    // Map to expected format
    const yieldTypes = [
      "Staking Yield",
      "Lending Yield",
      "Restaking Rewards",
      "Borrowing Optimization",
    ];

    return yieldTypes.map((type) => {
      const foundData = yieldData.find((d) => d._id === type);
      return {
        type,
        amount: foundData ? parseFloat(foundData.totalAmount) : 0,
      };
    });
  } catch (error) {
    console.error("Error in getUserYieldData:", error);
    return [];
  }
}

async function getUserLoansData(address) {
  try {
    // Initialize provider and contracts
    const provider = getProvider();
    const loanContract = new ethers.Contract(
      LOAN_CONTRACT_ADDRESS,
      LOAN_CONTRACT_ABI,
      provider
    );

    // Get loan IDs for the user
    const loanIds = await loanContract.getUserLoans(address);

    // Get loan details for each ID
    const loanPromises = loanIds.map(async (id) => {
      try {
        const loanData = await loanContract.getLoan(id);
        const dueDate = new Date(loanData.dueDate.toNumber() * 1000);
        const dueMonth = dueDate.toLocaleString("default", { month: "short" });
        const dueDay = dueDate.getDate();

        return {
          id: `#${id.toString().padStart(3, "0")}`,
          amount: parseFloat(ethers.utils.formatUnits(loanData.amount, 6)),
          currency: loanData.currency,
          rate: parseFloat(ethers.utils.formatUnits(loanData.interestRate, 2)),
          dueDate: `${dueDay}-${dueMonth}`,
          status: Date.now() < dueDate.getTime() ? "Active" : "Overdue",
          collateral: parseFloat(
            ethers.utils.formatEther(loanData.collateralAmount)
          ),
        };
      } catch (error) {
        console.error(`Error fetching loan ${id}:`, error);
        return null;
      }
    });

    const loans = await Promise.all(loanPromises);
    return loans.filter((loan) => loan !== null);
  } catch (error) {
    console.error("Error in getUserLoansData:", error);
    return [];
  }
}

async function getUserTransactionsData(address) {
  try {
    // Get transaction data from MongoDB
    if (!Transaction) {
      console.error("Transaction model is not defined");
      return [];
    }

    const transactions = await Transaction.find({
      userAddress: address.toLowerCase(),
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Map to expected format
    return transactions.map((tx) => ({
      hash: tx.txHash,
      reBtcUsed: parseFloat(tx.reBtcAmount || 0),
      stablecoins: parseFloat(tx.stablecoinAmount || 0),
      currency: tx.stablecoinType || "USDT",
      status: tx.status || "Completed",
    }));
  } catch (error) {
    console.error("Error in getUserTransactionsData:", error);
    return [];
  }
}

// Helper function to get lstBTC deposit count - FIXED FOR MONGODB
async function getUserLstBtcDepositCount(address) {
  try {
    // Check if UserDepositStats model is defined
    if (!UserDepositStats) {
      console.error("UserDepositStats model is not defined");
      return 0;
    }

    // Find user deposit stats in MongoDB
    const userDepositStats = await UserDepositStats.findOne({
      userAddress: address.toLowerCase(),
    });

    // If no stats found, return 0
    if (!userDepositStats) {
      return 0;
    }

    return userDepositStats.lstBtcDepositCount;
  } catch (error) {
    console.error("Error in getUserLstBtcDepositCount:", error);
    return 0;
  }
}

// Helper function to increment lstBTC deposit count - FIXED FOR MONGODB
async function incrementLstBtcDepositCount(address, amount = 1) {
  try {
    // Check if UserDepositStats model is defined
    if (!UserDepositStats) {
      console.error("UserDepositStats model is not defined");
      return 0;
    }

    console.log("UserDepositStats model:", UserDepositStats);
    console.log("Mongoose connection state:", mongoose.connection.readyState);

    // Find and update user deposit stats in MongoDB
    // Use findOneAndUpdate with upsert to create if it doesn't exist
    const result = await UserDepositStats.findOneAndUpdate(
      { userAddress: address.toLowerCase() },
      {
        $inc: { lstBtcDepositCount: amount },
        $set: { lastDepositDate: new Date() },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if it doesn't exist
      }
    );

    console.log("Updated document:", result);

    return result ? result.lstBtcDepositCount : 0;
  } catch (error) {
    console.error("Error in incrementLstBtcDepositCount:", error);
    return 0;
  }
}

// Export the incrementLstBtcDepositCount function
exports.incrementLstBtcDepositCount = incrementLstBtcDepositCount;
