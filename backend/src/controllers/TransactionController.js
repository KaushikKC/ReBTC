const db = require("../models");

// Record a new transaction
exports.recordTransaction = async (req, res) => {
  try {
    const { address } = req.user;
    const { txHash, type, amount, asset, status, details } = req.body;

    if (!txHash || !type || !amount || !asset) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create transaction record
    const transaction = await db.Transaction.create({
      userAddress: address,
      txHash,
      type,
      amount: parseFloat(amount),
      asset,
      status: status || "Completed",
      details: details || {},
    });

    res.status(201).json({
      success: true,
      transaction,
      message: "Transaction recorded successfully",
    });
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ error: "Failed to record transaction" });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { address } = req.user;
    const { limit = 10, offset = 0, type, asset } = req.query;

    // Build query conditions
    const whereConditions = { userAddress: address };

    if (type) {
      whereConditions.type = type;
    }

    if (asset) {
      whereConditions.asset = asset;
    }

    const transactions = await db.Transaction.findAll({
      where: whereConditions,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get total count for pagination
    const totalCount = await db.Transaction.count({
      where: whereConditions,
    });

    res.status(200).json({
      transactions,
      totalCount,
      page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
};

// Get transaction stats
exports.getTransactionStats = async (req, res) => {
  try {
    const { address } = req.user;

    // Get transaction counts by type
    const typeDistribution = await db.Transaction.findAll({
      attributes: [
        "type",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: { userAddress: address },
      group: ["type"],
      raw: true,
    });

    // Get transaction counts by asset
    const assetDistribution = await db.Transaction.findAll({
      attributes: [
        "asset",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
        [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"],
      ],
      where: { userAddress: address },
      group: ["asset"],
      raw: true,
    });

    // Get total transaction count
    const totalCount = await db.Transaction.count({
      where: { userAddress: address },
    });

    res.status(200).json({
      totalCount,
      typeDistribution,
      assetDistribution,
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({ error: "Failed to fetch transaction stats" });
  }
};
