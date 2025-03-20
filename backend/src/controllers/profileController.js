// controllers/profileController.js
import { ethers } from "ethers";
import {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  LOAN_CONTRACT_ADDRESS,
  TOKEN_ABI,
  LOAN_CONTRACT_ABI,
} from "../constants/contracts";
import db from "../models";
import { getProvider } from "../utils/web3";

// Get user profile complete data
export const getUserProfile = async (req, res) => {
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
export const getUserDeposits = async (req, res) => {
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
export const getYieldBreakdown = async (req, res) => {
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
export const getActiveLoans = async (req, res) => {
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
export const getTransactionHistory = async (req, res) => {
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
export const getLstBtcDepositCount = async (req, res) => {
  try {
    const { address } = req.user;
    const count = await getUserLstBtcDepositCount(address);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching lstBTC deposit count:", error);
    res.status(500).json({ error: "Failed to fetch lstBTC deposit count" });
  }
};

// Update lstBTC deposit count
export const updateLstBtcDepositCount = async (req, res) => {
  try {
    const { address } = req.user;
    const { amount } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    await incrementLstBtcDepositCount(address, parseFloat(amount));

    const newCount = await getUserLstBtcDepositCount(address);
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

  // Get on-chain data
  const [
    btcBalance,
    lstBtcBalance,
    totalEarnings,
    activeLoanAmount,
    insuranceStatus,
    lstBtcDepositCount,
  ] = await Promise.all([
    btcTokenContract
      .balanceOf(address)
      .then((bal) => ethers.utils.formatEther(bal)),
    lstBtcTokenContract
      .balanceOf(address)
      .then((bal) => ethers.utils.formatEther(bal)),
    db.YieldHistory.sum("amount", { where: { userAddress: address } }),
    loanContract
      .getUserActiveLoanAmount(address)
      .then((amount) => ethers.utils.formatUnits(amount, 6)),
    loanContract.hasInsurance(address),
    getUserLstBtcDepositCount(address),
  ]);

  // Calculate total deposited (BTC + LstBTC)
  const totalDeposited = parseFloat(btcBalance) + parseFloat(lstBtcBalance);

  return {
    totalDeposited: parseFloat(totalDeposited.toFixed(8)),
    totalEarnings: parseFloat(totalEarnings.toFixed(8)) || 0,
    activeLoans: parseFloat(activeLoanAmount),
    insuranceStatus,
    lstBtcDepositCount,
  };
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

  // Get APY rates from database or other source
  const apyRates = await db.ApyRates.findAll();
  const btcApy = apyRates.find((r) => r.asset === "BTC")?.rate || 4.5;
  const reBtcApy = apyRates.find((r) => r.asset === "ReBTC")?.rate || 7.2;

  // Get on-chain data
  const [btcBalance, lstBtcBalance, lstBtcDepositCount] = await Promise.all([
    btcTokenContract
      .balanceOf(address)
      .then((bal) => ethers.utils.formatEther(bal)),
    lstBtcTokenContract
      .balanceOf(address)
      .then((bal) => ethers.utils.formatEther(bal)),
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
}

async function getUserYieldData(address) {
  // Get yield data from database
  const yieldData = await db.YieldHistory.findAll({
    attributes: [
      "type",
      [db.sequelize.fn("sum", db.sequelize.col("amount")), "totalAmount"],
    ],
    where: { userAddress: address },
    group: ["type"],
    raw: true,
  });

  // Map to expected format
  const yieldTypes = [
    "Staking Yield",
    "Lending Yield",
    "Restaking Rewards",
    "Borrowing Optimization",
  ];

  return yieldTypes.map((type) => {
    const foundData = yieldData.find((d) => d.type === type);
    return {
      type,
      amount: foundData ? parseFloat(foundData.totalAmount) : 0,
    };
  });
}

async function getUserLoansData(address) {
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
  });

  return await Promise.all(loanPromises);
}

async function getUserTransactionsData(address) {
  // Get transaction data from database
  const transactions = await db.Transaction.findAll({
    where: { userAddress: address },
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  // Map to expected format
  return transactions.map((tx) => ({
    hash: tx.txHash,
    reBtcUsed: parseFloat(tx.reBtcAmount),
    stablecoins: parseFloat(tx.stablecoinAmount),
    currency: tx.stablecoinType,
    status: tx.status,
  }));
}

// Helper function to get lstBTC deposit count
async function getUserLstBtcDepositCount(address) {
  // Find or create user deposit stats
  const [userDepositStats] = await db.UserDepositStats.findOrCreate({
    where: { userAddress: address },
    defaults: {
      userAddress: address,
      lstBtcDepositCount: 0,
    },
  });

  return userDepositStats.lstBtcDepositCount;
}

// Helper function to increment lstBTC deposit count
async function incrementLstBtcDepositCount(address, amount = 1) {
  // Find or create user deposit stats
  const [userDepositStats] = await db.UserDepositStats.findOrCreate({
    where: { userAddress: address },
    defaults: {
      userAddress: address,
      lstBtcDepositCount: 0,
    },
  });

  // Increment the count
  userDepositStats.lstBtcDepositCount += amount;
  await userDepositStats.save();

  return userDepositStats.lstBtcDepositCount;
}
