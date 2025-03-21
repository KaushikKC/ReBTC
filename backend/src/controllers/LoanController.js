const { ethers } = require("ethers");
const { getProvider } = require("../utils/web3");

// Import contract addresses and ABIs
const {
  FLASH_LOAN_CONTRACT_ADDRESS,
  TOKEN_ABI,
  FLASH_LOAN_CONTRACT_ABI,
} = require("../constants/contracts");

// Import models from the models module
let models;
try {
  models = require("../models/mongoose/index");
  console.log("Successfully imported models from models module");
} catch (error) {
  console.error("Error importing models:", error);
  models = {};
}

const { Loan, Transaction, UserLoanStats } = models;

// Function to check if a variable is a valid Mongoose model
const isValidMongooseModel = (model) => {
  return (
    model &&
    typeof model.findOne === "function" &&
    typeof model.create === "function"
  );
};

// Log model status
console.log("Loan model available:", isValidMongooseModel(Loan) ? "Yes" : "No");
console.log(
  "Transaction model available:",
  isValidMongooseModel(Transaction) ? "Yes" : "No"
);
console.log(
  "UserLoanStats model available:",
  isValidMongooseModel(UserLoanStats) ? "Yes" : "No"
);

// Process a new flash loan
exports.processFlashLoan = async (req, res) => {
  try {
    // Check if models are valid
    if (
      !isValidMongooseModel(Loan) ||
      !isValidMongooseModel(Transaction) ||
      !isValidMongooseModel(UserLoanStats)
    ) {
      console.error("Required models are not valid in processFlashLoan");
      return res.status(500).json({ error: "Database model error" });
    }

    const { amount, asset, txHash, fee, address } = req.body;

    if (!amount || !asset || !txHash || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Processing flash loan:", { amount, asset, txHash, address });

    // Check if a loan with this txHash already exists
    const existingLoan = await Loan.findOne({ txHash });
    if (existingLoan) {
      console.log("Loan with this txHash already exists:", existingLoan);
      return res.status(200).json({
        success: true,
        loan: existingLoan,
        message: "Loan already processed",
      });
    }

    // Create loan record
    const loan = await Loan.create({
      userAddress: address.toLowerCase(),
      amount: parseFloat(amount),
      asset,
      txHash,
      fee: parseFloat(fee || 0),
      status: "Completed",
      type: "Flash",
      repaid: true, // Flash loans are repaid in the same transaction
      repaymentTxHash: txHash,
    });

    console.log("Loan created:", loan);

    // Create transaction record
    const transaction = await Transaction.create({
      userAddress: address.toLowerCase(),
      txHash,
      type: "Flash Loan",
      amount: parseFloat(amount),
      asset,
      status: "Completed",
    });

    console.log("Transaction created:", transaction);

    // Update user loan stats - find and update or create if not exists
    const userLoanStats = await UserLoanStats.findOneAndUpdate(
      { userAddress: address.toLowerCase() },
      {
        $inc: {
          flashLoanCount: 1,
          totalFlashLoanAmount: parseFloat(amount),
          totalFeePaid: parseFloat(fee || 0),
        },
        $set: { lastLoanDate: new Date() },
      },
      { new: true, upsert: true }
    );

    console.log("User loan stats updated:", userLoanStats);

    res.status(201).json({
      success: true,
      loan,
      message: "Flash loan processed successfully",
    });
  } catch (error) {
    console.error("Error processing flash loan:", error);

    // Check for duplicate key error
    if (error.code === 11000) {
      // Find the existing loan and return it
      try {
        const existingLoan = await Loan.findOne({ txHash: req.body.txHash });
        if (existingLoan) {
          return res.status(200).json({
            success: true,
            loan: existingLoan,
            message: "Loan already processed",
          });
        }
      } catch (findError) {
        console.error("Error finding existing loan:", findError);
      }
    }

    res.status(500).json({ error: "Failed to process flash loan" });
  }
};

// Get active loans count
exports.getActiveLoansCount = async (req, res) => {
  try {
    // Check if UserLoanStats is a valid model
    if (!isValidMongooseModel(UserLoanStats)) {
      console.error(
        "UserLoanStats is not a valid Mongoose model in getActiveLoansCount"
      );
      console.log("UserLoanStats type:", typeof UserLoanStats);
      console.log(
        "UserLoanStats methods:",
        UserLoanStats ? Object.keys(UserLoanStats) : "undefined"
      );

      // Return a default response instead of an error
      return res.status(200).json({
        count: 0,
        message: "No loan stats available",
      });
    }

    // Changed from req.body to req.query since this is a GET request
    const { address } = req.query;

    console.log("Getting active loans count for address:", address);

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // For flash loans, we count the total number as they're instantly repaid
    const userLoanStats = await UserLoanStats.findOne({
      userAddress: address.toLowerCase(),
    });

    console.log("User loan stats found:", userLoanStats);

    res.status(200).json({
      count: userLoanStats ? userLoanStats.flashLoanCount : 0,
    });
  } catch (error) {
    console.error("Error fetching active loans count:", error);

    // Return a default response instead of an error
    res.status(200).json({
      count: 0,
      error: "Failed to fetch active loans count",
    });
  }
};

// Get loan history
exports.getLoanHistory = async (req, res) => {
  try {
    // Check if Loan is a valid model
    if (!isValidMongooseModel(Loan)) {
      console.error("Loan is not a valid Mongoose model in getLoanHistory");
      return res.status(200).json({
        loans: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
        message: "No loan history available",
      });
    }

    const { address } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // Get loans with pagination
    const loans = await Loan.find({ userAddress: address.toLowerCase() })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Loan.countDocuments({
      userAddress: address.toLowerCase(),
    });

    res.status(200).json({
      loans,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching loan history:", error);
    res.status(200).json({
      loans: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
      error: "Failed to fetch loan history",
    });
  }
};

// Get loan stats
exports.getLoanStats = async (req, res) => {
  try {
    // Check if models are valid
    if (!isValidMongooseModel(UserLoanStats) || !isValidMongooseModel(Loan)) {
      console.error("Required models are not valid in getLoanStats");
      return res.status(200).json({
        flashLoanCount: 0,
        totalFlashLoanAmount: 0,
        lastLoanDate: null,
        assetDistribution: [],
        message: "No loan stats available",
      });
    }

    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // Get user loan stats
    const userLoanStats = await UserLoanStats.findOne({
      userAddress: address.toLowerCase(),
    });

    // Get additional stats from database - asset distribution
    const assetDistribution = await Loan.aggregate([
      { $match: { userAddress: address.toLowerCase() } },
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

    res.status(200).json({
      flashLoanCount: userLoanStats ? userLoanStats.flashLoanCount : 0,
      totalFlashLoanAmount: userLoanStats
        ? userLoanStats.totalFlashLoanAmount
        : 0,
      lastLoanDate: userLoanStats ? userLoanStats.lastLoanDate : null,
      assetDistribution,
    });
  } catch (error) {
    console.error("Error fetching loan stats:", error);
    res.status(200).json({
      flashLoanCount: 0,
      totalFlashLoanAmount: 0,
      lastLoanDate: null,
      assetDistribution: [],
      error: "Failed to fetch loan stats",
    });
  }
};
