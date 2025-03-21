"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCopy,
  FaBitcoin,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt,
  FaCoins,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import RepaymentModal from "../components/RepaymentModal";
import TimeLoader from "../components/TimeLoader";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useDataContext } from "@/context/DataContext";
import { ethers } from "ethers";
import Footer from "../components/Footer";
// Import token minting modal
import TokenMintModal from "../components/TokenMintModal";

// Import contract constants
import {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  TOKEN_ABI,
  INSURANCE_CONTRACT_ADDRESS,
  INSURANCE_CONTRACT_ABI,
  DEPOSIT_CONTRACT_ADDRESS,
  DEPOSIT_CONTRACT_ABI,
} from "../../constants/contracts";

// Local storage keys for flash loan transactions
const TRANSACTION_HISTORY_KEY = "flashLoanTransactionHistory";
const TRANSACTION_HISTORY_TIMESTAMP_KEY =
  "flashLoanTransactionHistoryTimestamp";

// Helper function to save transaction to local storage
const saveTransaction = (transaction) => {
  try {
    // Get existing transactions from local storage
    const existingTransactions = JSON.parse(
      localStorage.getItem("transactions") || "[]"
    );

    // Check if transaction with same hash already exists
    const existingIndex = existingTransactions.findIndex(
      (tx) => tx.hash === transaction.hash
    );

    if (existingIndex >= 0) {
      // Update existing transaction
      existingTransactions[existingIndex] = {
        ...existingTransactions[existingIndex],
        ...transaction,
      };
    } else {
      // Add new transaction
      existingTransactions.push(transaction);
    }

    // Save back to local storage
    localStorage.setItem("transactions", JSON.stringify(existingTransactions));
    return true;
  } catch (error) {
    console.error("Error saving transaction to local storage:", error);
    return false;
  }
};

// Helper function to get transactions from local storage
const getTransactions = (address) => {
  try {
    const transactions = JSON.parse(
      localStorage.getItem("transactions") || "[]"
    );
    // Filter by address if provided
    return address
      ? transactions.filter(
          (tx) => tx.userAddress?.toLowerCase() === address.toLowerCase()
        )
      : transactions;
  } catch (error) {
    console.error("Error getting transactions from local storage:", error);
    return [];
  }
};

// Helper function to get flash loan transactions from localStorage
const getFlashLoanTransactions = () => {
  try {
    const cachedTransactionsStr = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    if (cachedTransactionsStr) {
      return JSON.parse(cachedTransactionsStr);
    }
    return [];
  } catch (error) {
    console.error(
      "Error loading flash loan transactions from localStorage:",
      error
    );
    return [];
  }
};

// Convert flash loan transactions to active loans format
const convertFlashLoansToActiveLoans = (flashLoans) => {
  if (!flashLoans || !Array.isArray(flashLoans) || flashLoans.length === 0) {
    return [];
  }

  return flashLoans.map((loan, index) => {
    // Generate a unique ID based on index or hash
    const id = loan.txHash ? loan.txHash.substring(0, 6) : `#${index + 1}`;

    return {
      id: `#${id}`,
      amount: parseFloat(loan.lstBTCUsed) || 0, // Use lstBTCUsed instead of amount
      borrowed: parseFloat(loan.amount) || 0,
      currency: "lstBTC", // Change to lstBTC since we're showing lstBTC used
      rate: loan.feePercentage || 0.3,
      interest: loan.feePercentage || 0.3,
      dueDate: "Instant", // Flash loans are repaid instantly
      status: "Completed",
      collateral: 0,
      txHash: loan.fullTxHash || loan.txHash, // Use fullTxHash if available
      timestamp: loan.timestamp || new Date().toISOString(),
      stablecoinsReceived: parseFloat(loan.stablecoinsReceived) || 0,
      stablecoinCurrency: loan.stablecoin || loan.currency || "USDT",
    };
  });
};

const Profile = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true); // Start with true to show loading
  const [showContent, setShowContent] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [userStats, setUserStats] = useState({
    totalDeposited: 0,
    totalEarnings: 0,
    activeLoans: 0,
    insuranceStatus: true,
  });

  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Effect to handle initial loading and fetch data
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Get insurance contract instance
        const insuranceContract = await getContractInstance(
          INSURANCE_CONTRACT_ADDRESS,
          INSURANCE_CONTRACT_ABI
        );

        // Get deposit contract instance
        const depositContract = await getContractInstance(
          DEPOSIT_CONTRACT_ADDRESS,
          DEPOSIT_CONTRACT_ABI
        );

        if (insuranceContract && depositContract) {
          // Get total liquidity from insurance contract
          const poolBalanceWei = await insuranceContract.poolBalance();
          const totalDeposited = parseFloat(
            ethers.utils.formatUnits(poolBalanceWei, 18)
          );

          // Get total earnings from deposit contract
          const btcTotalValueLockedWei =
            await depositContract.btcTotalValueLocked();
          const totalEarnings = parseFloat(
            ethers.utils.formatUnits(btcTotalValueLockedWei, 18)
          );

          // Get active loans from flash loan transaction history
          const flashLoanTransactions = getFlashLoanTransactions();
          const activeLoansAmount = flashLoanTransactions.reduce(
            (total, tx) => {
              return total + (parseFloat(tx.amount) || 0);
            },
            0
          );

          // Update user stats
          setUserStats({
            totalDeposited,
            totalEarnings,
            activeLoans: activeLoansAmount,
            insuranceStatus: true, // Assuming insurance is active
          });
        }
      } catch (error) {
        console.error("Error fetching contract data:", error);
        toast.error("Failed to fetch contract data");
      } finally {
        // Stop loading after data fetch
        setIsProcessing(false);
        setShowContent(true);
      }
    };

    const loadingTimer = setTimeout(() => {
      if (isProcessing) {
        // If contract data is taking too long, show content anyway
        setIsProcessing(false);
        setShowContent(true);
      }
    }, 5000); // 5 second timeout

    // Load transactions from local storage
    if (address) {
      // Load regular transactions
      const userTransactions = getTransactions(address);
      setTransactions(userTransactions);

      // Load flash loan transactions and convert to active loans
      const flashLoanTransactions = getFlashLoanTransactions();
      console.log("Flash loan transactions:", flashLoanTransactions);

      // Convert flash loan transactions to active loans format
      const loansFromFlashLoans = convertFlashLoansToActiveLoans(
        flashLoanTransactions
      );
      setActiveLoans(loansFromFlashLoans);

      // Fetch contract data
      fetchContractData();
    } else {
      // If no address, stop loading
      setIsProcessing(false);
      setShowContent(true);
    }

    return () => clearTimeout(loadingTimer);
  }, [address, getContractInstance]);

  // Function to add a new transaction (can be called from other components)
  const addTransaction = (transaction) => {
    // Make sure transaction has the user address
    const txWithAddress = {
      ...transaction,
      userAddress: address,
      timestamp: new Date().toISOString(),
    };

    // Save to local storage
    const saved = saveTransaction(txWithAddress);

    if (saved) {
      // Update state
      setTransactions((prev) => {
        const existingIndex = prev.findIndex(
          (tx) => tx.hash === transaction.hash
        );
        if (existingIndex >= 0) {
          // Update existing transaction
          const updated = [...prev];
          updated[existingIndex] = txWithAddress;
          return updated;
        } else {
          // Add new transaction
          return [...prev, txWithAddress];
        }
      });

      toast.success("Transaction recorded successfully");
    } else {
      toast.error("Failed to record transaction");
    }
  };

  // Make addTransaction available globally
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addTransaction = addTransaction;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.addTransaction;
      }
    };
  }, [address]);

  const walletAddress = address || "0xA12...B34";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRepayClick = (loan) => {
    if (!loan) return;

    const preparedLoan = {
      ...loan,
      borrowed: loan.amount,
      interest: loan.rate,
    };

    setSelectedLoan(preparedLoan);
    setShowRepayModal(true);
  };

  const handleOpenMintModal = () => {
    setShowMintModal(true);
  };

  const deposits = [
    { asset: "BTC", amount: 1.0, apy: 4.5, status: "Active" },
    { asset: "ReBTC", amount: 0.25, apy: 7.2, status: "Active" },
  ];

  const yieldBreakdown = [
    { type: "Staking Yield", amount: 0.05 },
    { type: "Lending Yield", amount: 0.04 },
    { type: "Restaking Rewards", amount: 0.03 },
    { type: "Borrowing Optimization", amount: 0.03 },
  ];

  // Function to handle repayment success
  const handleRepaymentSuccess = (repaymentData) => {
    // Add repayment transaction to history
    addTransaction({
      hash: `0x${Math.random().toString(16).substring(2, 10)}`, // Generate random hash for demo
      reBtcUsed: 0,
      stablecoins: repaymentData.amount || selectedLoan.amount,
      currency: selectedLoan.currency,
      status: "Paid",
      type: "Repayment",
      description: `Repaid loan ${selectedLoan.id}`,
    });

    // Close modal
    setShowRepayModal(false);
    setSelectedLoan(null);
  };

  // Function to format transaction date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to format BTC amounts
  const formatBTC = (amount) => {
    if (typeof amount !== "number") return "0 BTC";
    return `${amount.toFixed(4)} BTC`;
  };

  // Function to format USD amounts
  const formatUSD = (amount) => {
    if (typeof amount !== "number") return "$0 USDT";
    return `$${amount.toFixed(2)} USDT`;
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-['Quantify']">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#1C2128]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50"
            >
              <TimeLoader />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-medium"
              >
                Fetching profile
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showContent && (
            <>
              {/* User Information Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="flex items-center mb-4 md:mb-0">
                    <h1 className="text-2xl font-bold mr-4 tracking-[1px]">
                      Profile
                    </h1>
                    <div className="flex items-center bg-[#2D333B] rounded-lg px-3 py-2">
                      <span className="text-gray-300 mr-2">
                        {walletAddress}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={copyToClipboard}
                        className="text-[#F7931A] hover:text-[#F7931A]/80"
                      >
                        {copySuccess ? <FaCheckCircle /> : <FaCopy />}
                      </motion.button>
                    </div>
                  </div>

                  {/* Single Token Minting Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenMintModal}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F7931A] to-[#2F80ED] text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
                  >
                    <FaCoins />
                    <span>Mint Tokens</span>
                  </motion.button>
                </div>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#1C2128]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
                    >
                      <TimeLoader />
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white font-medium"
                      >
                        Fetching profile
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    title="Total BTC Deposited"
                    value={formatBTC(userStats.totalDeposited)}
                    icon={FaBitcoin}
                  />
                  <StatsCard
                    title="Total Earnings"
                    value={formatBTC(userStats.totalEarnings)}
                    icon={FaBitcoin}
                  />
                  <StatsCard
                    title="Active Loans"
                    value={formatUSD(userStats.activeLoans)}
                    icon={FaExchangeAlt}
                  />
                  <StatsCard
                    title="Insurance Coverage"
                    value={userStats.insuranceStatus ? "Active" : "Inactive"}
                    icon={FaCheckCircle}
                    status={userStats.insuranceStatus}
                  />
                </div>
              </motion.div>

              {/* Deposits & Earnings Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#1C2128] rounded-xl p-6 shadow-lg"
                >
                  <h2 className="text-xl font-bold mb-6">Deposited Assets</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-400">
                          <th className="text-left pb-4">Asset</th>
                          <th className="text-left pb-4">Amount</th>
                          <th className="text-left pb-4">APY</th>
                          <th className="text-left pb-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((deposit, index) => (
                          <tr key={index} className="border-t border-[#2D333B]">
                            <td className="py-4">{deposit.asset}</td>
                            <td className="py-4">{deposit.amount}</td>
                            <td className="py-4 text-[#F7931A]">
                              {deposit.apy}%
                            </td>
                            <td className="py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {deposit.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#1C2128] rounded-xl p-6 shadow-lg"
                >
                  <h2 className="text-xl font-bold mb-6">Yield Breakdown</h2>
                  <div className="space-y-4">
                    {yieldBreakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300">{item.type}</span>
                        <span className="text-[#F7931A] font-bold">
                          {item.amount} BTC
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-[#2D333B]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <span className="text-[#F7931A] font-bold">
                          {yieldBreakdown.reduce(
                            (acc, curr) => acc + curr.amount,
                            0
                          )}{" "}
                          BTC
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Active Loans Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg"
              >
                <h2 className="text-xl font-bold mb-6">Flash Loan History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left pb-4">Loan ID</th>
                        <th className="text-left pb-4">lstBTC Used</th>
                        <th className="text-left pb-4">Stablecoins Received</th>
                        <th className="text-left pb-4">Date</th>
                        <th className="text-left pb-4">Status</th>
                        <th className="text-left pb-4">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLoans.length > 0 ? (
                        activeLoans.map((loan, index) => (
                          <tr key={index} className="border-t border-[#2D333B]">
                            <td className="py-4">{loan.id}</td>
                            <td className="py-4">
                              {loan.amount} {loan.currency}
                            </td>
                            <td className="py-4">
                              {loan.stablecoinsReceived}{" "}
                              {loan.stablecoinCurrency}
                            </td>
                            <td className="py-4">
                              {formatDate(loan.timestamp)}
                            </td>
                            <td className="py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  loan.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : loan.status === "Completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {loan.status}
                              </span>
                            </td>
                            <td className="py-4">
                              {loan.txHash ? (
                                <a
                                  href={`https://scan.test2.btcs.network/tx/${loan.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#2F80ED] hover:underline"
                                >
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-[#2D333B]">
                          <td
                            colSpan="6"
                            className="py-4 text-center text-gray-400"
                          >
                            No flash loans found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
              {/* Transaction History Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#1C2128] rounded-xl p-6 shadow-lg"
              >
                <h2 className="text-xl font-bold mb-6">Transaction History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left pb-4">Transaction Hash</th>
                        <th className="text-left pb-4">Asset Used</th>
                        <th className="text-left pb-4">Amount</th>
                        <th className="text-left pb-4">Date</th>
                        <th className="text-left pb-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        // Sort transactions by timestamp (newest first) and map them
                        [...transactions]
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp) - new Date(a.timestamp)
                          )
                          .map((tx, index) => (
                            <tr
                              key={index}
                              className="border-t border-[#2D333B]"
                            >
                              <td className="py-4">
                                {tx.hash && tx.hash.length > 10
                                  ? `${tx.hash.substring(
                                      0,
                                      6
                                    )}...${tx.hash.substring(
                                      tx.hash.length - 4
                                    )}`
                                  : tx.hash}
                              </td>
                              <td className="py-4">
                                {tx.type === "Flash Loan" || tx.reBtcUsed > 0
                                  ? "ReBTC"
                                  : tx.assetUsed || tx.currency || "N/A"}
                              </td>
                              <td className="py-4">
                                {tx.type === "Flash Loan" || tx.reBtcUsed > 0
                                  ? `${
                                      tx.reBtcUsed || tx.lstBTCUsed || 0
                                    } ReBTC → ${tx.stablecoins || 0} ${
                                      tx.currency || "USDT"
                                    }`
                                  : `${tx.stablecoins || tx.amount || 0} ${
                                      tx.currency || "USDT"
                                    }`}
                              </td>
                              <td className="py-4">
                                {formatDate(tx.timestamp)}
                              </td>
                              <td className="py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    tx.status === "Paid" ||
                                    tx.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr className="border-t border-[#2D333B]">
                          <td
                            colSpan="5"
                            className="py-4 text-center text-gray-400"
                          >
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Repayment Modal */}
      <AnimatePresence>
        {showRepayModal && selectedLoan && (
          <RepaymentModal
            loan={{
              ...selectedLoan,
              borrowed: selectedLoan.amount,
              interest: selectedLoan.rate,
            }}
            onClose={() => {
              setShowRepayModal(false);
              setSelectedLoan(null);
            }}
            onRepaymentSuccess={handleRepaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Token Minting Modal */}
      <AnimatePresence>
        {showMintModal && (
          <TokenMintModal
            onClose={() => setShowMintModal(false)}
            onMintSuccess={(tokenData) => {
              // Add mint transaction to history
              addTransaction({
                hash: `0x${Math.random().toString(16).substring(2, 10)}`, // Generate random hash for demo
                reBtcUsed: 0,
                stablecoins: tokenData.amount || 0,
                currency: tokenData.symbol || "BTC",
                status: "Completed",
                type: "Mint",
                description: `Minted ${tokenData.amount} ${tokenData.symbol}`,
              });
            }}
          />
        )}
      </AnimatePresence>
      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, status }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#2D333B] p-6 rounded-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-[#1C2128] rounded-lg">
          <Icon className="text-[#F7931A] text-xl" />
        </div>
        <h3 className="text-gray-400">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
        {status !== undefined && (
          <span
            className={`ml-2 text-sm ${
              status ? "text-green-500" : "text-red-500"
            }`}
          >
            ●
          </span>
        )}
      </p>
    </motion.div>
  );
};

export default Profile;
