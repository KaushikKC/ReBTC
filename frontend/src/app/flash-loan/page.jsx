"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";
import { FaChevronDown } from "react-icons/fa";
import TimeLoader from "../components/TimeLoader";
import { ethers } from "ethers";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useBalance } from "wagmi";
import { toast } from "react-hot-toast";
import { useDataContext } from "@/context/DataContext";
import Footer from "../components/Footer";
// Import contract constants
import {
  FLASH_LOAN_CONTRACT_ADDRESS,
  FLASH_LOAN_CONTRACT_ABI,
  LSTBTC_TOKEN_ADDRESS,
  TOKEN_ABI,
} from "../../constants/contracts";

// Local storage keys
const TRANSACTION_HISTORY_KEY = "flashLoanTransactionHistory";
const TRANSACTION_HISTORY_TIMESTAMP_KEY =
  "flashLoanTransactionHistoryTimestamp";
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// Profile page transaction storage key
const PROFILE_TRANSACTIONS_KEY = "transactions";

// Helper function to save transaction to profile storage
const saveTransactionToProfile = (transaction) => {
  try {
    // Get existing transactions from local storage
    const existingTransactions = JSON.parse(
      localStorage.getItem(PROFILE_TRANSACTIONS_KEY) || "[]"
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
    localStorage.setItem(
      PROFILE_TRANSACTIONS_KEY,
      JSON.stringify(existingTransactions)
    );
    console.log("Saved transaction to profile storage");
    return true;
  } catch (error) {
    console.error("Error saving transaction to profile storage:", error);
    return false;
  }
};

const FlashLoan = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lstBTCAmount, setLstBTCAmount] = useState("");
  const [selectedStablecoin, setSelectedStablecoin] = useState("USDT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  // Contract state variables
  const [availableLiquidity, setAvailableLiquidity] = useState(0);
  const [feePercentage, setFeePercentage] = useState(30); // Default 30%
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [conversionRate, setConversionRate] = useState(1.3); // Default value: 1.3 lstBTC = 1 stablecoin

  const { authenticated, user: privyUser } = usePrivy();
  const { address } = useAccount();
  const { getContractInstance, provider } = useDataContext();

  // Get lstBTC balance
  const { data: lstBtcBalanceData } = useBalance({
    address,
    token: LSTBTC_TOKEN_ADDRESS,
    watch: true,
  });

  const availableLstBTC = lstBtcBalanceData
    ? parseFloat(ethers.utils.formatUnits(lstBtcBalanceData.value, 18))
    : 0;

  // Load transaction history from localStorage on component mount
  useEffect(() => {
    const loadCachedTransactionHistory = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window !== "undefined") {
          const cachedTimestampStr = localStorage.getItem(
            TRANSACTION_HISTORY_TIMESTAMP_KEY
          );
          const cachedTransactionsStr = localStorage.getItem(
            TRANSACTION_HISTORY_KEY
          );

          if (cachedTimestampStr && cachedTransactionsStr) {
            const cachedTimestamp = parseInt(cachedTimestampStr);
            const now = Date.now();

            // Check if cache is still valid
            if (now - cachedTimestamp < CACHE_EXPIRATION_TIME) {
              const cachedTransactions = JSON.parse(cachedTransactionsStr);
              setRecentTransactions(cachedTransactions);
              console.log("Loaded transaction history from cache");
              return true;
            } else {
              console.log("Cache expired, fetching fresh data");
            }
          }
        }
        return false;
      } catch (error) {
        console.error("Error loading cached transaction history:", error);
        return false;
      }
    };

    // Try to load from cache first, but don't set isLoading to false yet
    loadCachedTransactionHistory();
  }, []);

  // Fetch contract data on component mount
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setIsLoading(true);

        const flashLoanContract = await getContractInstance(
          FLASH_LOAN_CONTRACT_ADDRESS,
          FLASH_LOAN_CONTRACT_ABI
        );

        if (flashLoanContract) {
          // Fetch available liquidity for both stablecoins
          const usdtLiquidityWei =
            await flashLoanContract.getAvailableStablecoinLiquidity(true);
          const usdcLiquidityWei =
            await flashLoanContract.getAvailableStablecoinLiquidity(false);

          console.log(usdtLiquidityWei, usdcLiquidityWei);

          // Use the selected stablecoin's liquidity
          const liquidityWei =
            selectedStablecoin === "USDT" ? usdtLiquidityWei : usdcLiquidityWei;
          const liquidity = parseFloat(
            ethers.utils.formatUnits(liquidityWei, 18)
          ); // Stablecoins use 6 decimals
          setAvailableLiquidity(liquidity);

          // Fetch fee percentage
          try {
            const feePercentageBps = await flashLoanContract.feePercentage();
            setFeePercentage(feePercentageBps.toNumber() / 100); // Convert from basis points to percentage
          } catch (error) {
            console.warn(
              "Could not fetch fee percentage, using default",
              error
            );
          }

          // Fetch recent transactions (Exchange events)
          await fetchRecentTransactions(flashLoanContract);
        }
      } catch (error) {
        console.error("Error fetching contract data:", error);
        toast.error("Failed to load contract data. Please try again later.");
      } finally {
        // Add a slight delay for the loading animation
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    fetchContractData();
  }, [selectedStablecoin]);

  // Save transaction history to localStorage whenever it changes
  useEffect(() => {
    if (recentTransactions.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          TRANSACTION_HISTORY_KEY,
          JSON.stringify(recentTransactions)
        );
        localStorage.setItem(
          TRANSACTION_HISTORY_TIMESTAMP_KEY,
          Date.now().toString()
        );
        console.log("Saved transaction history to cache");
      } catch (error) {
        console.error("Error saving transaction history to cache:", error);
      }
    }
  }, [recentTransactions]);

  // Fetch recent transactions from contract events
  const fetchRecentTransactions = async (contract) => {
    try {
      // Get the current block number
      const currentBlock = await provider.getBlockNumber();

      // Look back 10000 blocks (adjust as needed)
      const fromBlock = Math.max(0, currentBlock - 10000);

      // Get Exchange events
      const exchangeFilter = contract.filters.Exchange();
      const exchangeEvents = await contract.queryFilter(
        exchangeFilter,
        fromBlock
      );

      // Process events
      const processedTransactions = await Promise.all(
        exchangeEvents.map(async (event) => {
          const block = await event.getBlock();
          const timestamp = new Date(block.timestamp * 1000).toLocaleString();

          // Determine stablecoin type from the address
          const stablecoinAddress = event.args.stablecoinUsed.toLowerCase();
          let stablecoinType = "Unknown";

          try {
            // Get USDT and USDC addresses from contract
            const usdtAddress = (await contract.usdtToken()).toLowerCase();
            const usdcAddress = (await contract.usdcToken()).toLowerCase();

            if (stablecoinAddress === usdtAddress) {
              stablecoinType = "USDT";
            } else if (stablecoinAddress === usdcAddress) {
              stablecoinType = "USDC";
            }
          } catch (error) {
            console.warn("Could not determine stablecoin type", error);
          }

          return {
            txHash: `${event.transactionHash.slice(
              0,
              6
            )}...${event.transactionHash.slice(-4)}`,
            borrower: `${event.args.user.slice(0, 6)}...${event.args.user.slice(
              -4
            )}`,
            lstBTCUsed: parseFloat(
              ethers.utils.formatUnits(event.args.lstBtcAmount, 18)
            ),
            stablecoinsReceived: parseFloat(
              ethers.utils.formatUnits(event.args.stablecoinAmount, 6)
            ),
            currency: stablecoinType,
            status: "completed",
            timestamp: timestamp,
            fullTxHash: event.transactionHash,
          };
        })
      );

      // Sort by timestamp (most recent first)
      processedTransactions.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      // Take the most recent 10 transactions
      setRecentTransactions(processedTransactions.slice(0, 10));
    } catch (error) {
      console.error("Error fetching transaction events:", error);
    }
  };

  // Calculate stablecoin amount based on lstBTC amount
  // According to the contract: stablecoinAmount = lstBtcAmount * 10 / 13
  const calculateReceiveAmount = () => {
    if (!lstBTCAmount) return 0;
    // This matches the contract calculation: lstBtcAmount * 10 / 13
    return ((parseFloat(lstBTCAmount) * 10) / 13).toFixed(2);
  };

  // Calculate fee amount based on lstBTC amount
  // According to the contract: feeAmount = lstBtcAmount * 3 / 13
  const calculateFeeAmount = () => {
    if (!lstBTCAmount) return 0;
    // This matches the contract calculation: lstBtcAmount * 3 / 13
    return ((parseFloat(lstBTCAmount) * 3) / 13).toFixed(6);
  };

  const executeExchange = async () => {
    if (!authenticated) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!lstBTCAmount || parseFloat(lstBTCAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsTransacting(true);

      // Get contract instances
      const flashLoanContract = await getContractInstance(
        FLASH_LOAN_CONTRACT_ADDRESS,
        FLASH_LOAN_CONTRACT_ABI
      );

      const lstBtcTokenContract = await getContractInstance(
        LSTBTC_TOKEN_ADDRESS,
        TOKEN_ABI
      );

      if (!flashLoanContract || !lstBtcTokenContract) {
        throw new Error("Failed to initialize contracts");
      }

      // Convert lstBTC amount to wei (18 decimals)
      const lstBTCAmountWei = ethers.utils.parseEther(lstBTCAmount);

      // Step 1: Approve token transfer
      toast.loading("Approving token transfer...");
      const approveTx = await lstBtcTokenContract.approve(
        FLASH_LOAN_CONTRACT_ADDRESS,
        lstBTCAmountWei
      );

      // Wait for approval transaction to be mined
      await approveTx.wait();
      toast.dismiss();

      // Step 2: Execute the exchange
      toast.loading(`Exchanging lstBTC for ${selectedStablecoin}...`);

      // Determine which stablecoin to use
      const useUsdt = selectedStablecoin === "USDT";

      // Execute the transaction
      const tx = await flashLoanContract.exchangeLstBtcForStablecoin(
        lstBTCAmountWei,
        useUsdt
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      toast.dismiss();

      // Update UI with transaction hash
      setTransactionHash(receipt.transactionHash);

      // Add transaction to recent transactions
      const newTransaction = {
        txHash: `${receipt.transactionHash.slice(
          0,
          6
        )}...${receipt.transactionHash.slice(-4)}`,
        borrower: `${address.slice(0, 6)}...${address.slice(-4)}`,
        lstBTCUsed: parseFloat(lstBTCAmount),
        stablecoinsReceived: parseFloat(calculateReceiveAmount()),
        currency: selectedStablecoin,
        status: "completed",
        timestamp: new Date().toLocaleString(),
        fullTxHash: receipt.transactionHash,
      };

      setRecentTransactions([newTransaction, ...recentTransactions]);

      // Save transaction to profile storage
      const profileTransaction = {
        hash: receipt.transactionHash,
        reBtcUsed: parseFloat(lstBTCAmount),
        stablecoins: parseFloat(calculateReceiveAmount()),
        currency: selectedStablecoin,
        status: "Completed",
        type: "Flash Loan",
        description: `Exchanged ${lstBTCAmount} lstBTC for ${calculateReceiveAmount()} ${selectedStablecoin}`,
        userAddress: address,
        timestamp: new Date().toISOString(),
      };

      saveTransactionToProfile(profileTransaction);

      // Also try to use the global addTransaction function if available
      if (
        typeof window !== "undefined" &&
        typeof window.addTransaction === "function"
      ) {
        try {
          window.addTransaction(profileTransaction);
          console.log("Used global addTransaction function");
        } catch (error) {
          console.error("Error using global addTransaction function:", error);
        }
      }

      // Refresh contract data
      const liquidityWei =
        await flashLoanContract.getAvailableStablecoinLiquidity(useUsdt);
      const liquidity = parseFloat(ethers.utils.formatUnits(liquidityWei, 6));
      setAvailableLiquidity(liquidity);

      // Reset form
      setLstBTCAmount("");

      toast.success(`Successfully exchanged lstBTC for ${selectedStablecoin}!`);
    } catch (error) {
      console.error("Transaction error:", error);
      toast.dismiss();
      toast.error(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsTransacting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <TimeLoader />
          <p className="text-white mt-4 font-['Quantify']">Loading Exchange</p>
        </div>
      </div>
    );
  }
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
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
      <Navbar />

      {/* Navigation Buttons */}
      <div className="flex-grow flex flex-col items-center px-4 pt-32">
        <div className="flex flex-wrap justify-center pb-16 gap-4 md:gap-8 w-full max-w-7xl">
          <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
          <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
          <SqueezeButton text={"Instant Liquidity"} to="/flash-loan" />
          <SqueezeButton text={"BTC Insurance Pool"} to="/insurance" />
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center py-3 justify-center px-4 md:px-8"
          >
            {/* Main Content */}
            <div className="w-full max-w-2xl px-4 md:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg"
              >
                {/* lstBTC Input */}
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm mb-2">
                    lstBTC Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={lstBTCAmount}
                      onChange={(e) => setLstBTCAmount(e.target.value)}
                      className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                      placeholder="0.00"
                      max={availableLstBTC}
                      disabled={isTransacting}
                    />
                    <button
                      onClick={() =>
                        setLstBTCAmount(availableLstBTC.toString())
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-3 py-1 rounded-md text-sm hover:bg-[#2F80ED]/80 transition-colors"
                      disabled={isTransacting}
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Available: {availableLstBTC.toFixed(6)} lstBTC
                  </p>
                </div>

                {/* Stablecoin Selection */}
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm mb-2">
                    Select Stablecoin
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between bg-[#2D333B] p-4 rounded-lg hover:bg-[#373E47] transition-colors"
                      disabled={isTransacting}
                    >
                      <span className="text-white">{selectedStablecoin}</span>
                      <FaChevronDown className="text-gray-400" />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute w-full mt-2 bg-[#2D333B] rounded-lg shadow-xl z-10"
                        >
                          {["USDT", "USDC"].map((coin) => (
                            <button
                              key={coin}
                              onClick={() => {
                                setSelectedStablecoin(coin);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-[#373E47] text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {coin}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Conversion Details */}
                <div className="bg-[#2D333B] p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Conversion Rate</p>
                      <p className="text-xl font-bold text-white">
                        1.3 lstBTC = 1 {selectedStablecoin}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">You'll Receive</p>
                      <p className="text-xl font-bold text-white">
                        {calculateReceiveAmount()} {selectedStablecoin}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Fee (in lstBTC)</p>
                      <p className="text-xl font-bold text-white">
                        {calculateFeeAmount()} lstBTC
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Fee Percentage</p>
                      <p className="text-xl font-bold text-white">
                        {feePercentage}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <div className="p-4 rounded-lg text-sm text-gray-300">
                  ⚠️ Your lstBTC will be deposited into the insurance pool.
                  You'll receive stablecoins in exchange.
                </div>

                {/* Transaction Hash (if available) */}
                {transactionHash && (
                  <div className="bg-[#2D333B] p-4 rounded-lg mb-6 mt-4">
                    <p className="text-gray-400 mb-1">Transaction Hash:</p>
                    <a
                      href={`https://scan.test2.btcs.network/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 break-all hover:underline"
                    >
                      {transactionHash}
                    </a>
                  </div>
                )}

                {/* Execute Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={
                    !lstBTCAmount ||
                    lstBTCAmount <= 0 ||
                    isTransacting ||
                    !authenticated
                  }
                  className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
                    ${
                      !lstBTCAmount ||
                      lstBTCAmount <= 0 ||
                      isTransacting ||
                      !authenticated
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#F7931A]/90"
                    }`}
                  onClick={executeExchange}
                >
                  {isTransacting ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    "Exchange lstBTC"
                  )}
                </motion.button>

                {!authenticated && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Please connect your wallet to exchange lstBTC
                  </p>
                )}
              </motion.div>

              {/* Pool Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              >
                <div className="bg-[#1C2128] p-6 rounded-xl shadow-lg">
                  <h3 className="text-gray-300 mb-2">
                    Available {selectedStablecoin} Liquidity
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    ${availableLiquidity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#1C2128] p-6 rounded-xl shadow-lg">
                  <h3 className="text-gray-300 mb-2">Exchange Rate</h3>
                  <p className="text-2xl font-bold text-white">
                    1.3 lstBTC = 1 {selectedStablecoin}
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="w-full max-w-7xl px-4 md:px-8">
              {/* Recent Transactions Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#1C2128] rounded-xl p-6 shadow-lg overflow-x-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Recent Transactions
                  </h2>
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      const flashLoanContract = await getContractInstance(
                        FLASH_LOAN_CONTRACT_ADDRESS,
                        FLASH_LOAN_CONTRACT_ABI
                      );
                      await fetchRecentTransactions(flashLoanContract);
                      setIsLoading(false);
                    }}
                    className="px-3 py-1 bg-[#2D333B] hover:bg-[#373E47] text-gray-300 rounded-md text-sm transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No transactions found
                  </div>
                ) : (
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="text-gray-400 text-left">
                        <th className="pb-4">Tx Hash</th>
                        <th className="pb-4">User</th>
                        <th className="pb-4">lstBTC Used</th>
                        <th className="pb-4">Stablecoins Received</th>
                        <th className="pb-4">Time</th>
                        <th className="pb-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx, index) => (
                        <tr key={index} className="border-t border-[#2D333B]">
                          <td className="py-4">
                            <a
                              href={`https://scan.test2.btcs.network/tx/${tx.fullTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                              onClick={() => {
                                // Save this transaction to profile storage when clicked
                                if (address) {
                                  const profileTransaction = {
                                    hash: tx.fullTxHash,
                                    reBtcUsed: tx.lstBTCUsed,
                                    stablecoins: tx.stablecoinsReceived,
                                    currency: tx.currency,
                                    status:
                                      tx.status === "completed"
                                        ? "Completed"
                                        : tx.status,
                                    type: "Flash Loan",
                                    description: `Exchanged ${tx.lstBTCUsed} lstBTC for ${tx.stablecoinsReceived} ${tx.currency}`,
                                    userAddress: address,
                                    timestamp: new Date(
                                      tx.timestamp
                                    ).toISOString(),
                                  };

                                  saveTransactionToProfile(profileTransaction);

                                  // Also try to use the global addTransaction function if available
                                  if (
                                    typeof window !== "undefined" &&
                                    typeof window.addTransaction === "function"
                                  ) {
                                    try {
                                      window.addTransaction(profileTransaction);
                                    } catch (error) {
                                      console.error(
                                        "Error using global addTransaction function:",
                                        error
                                      );
                                    }
                                  }

                                  toast.success(
                                    "Transaction added to your profile"
                                  );
                                }
                              }}
                            >
                              {tx.txHash}
                            </a>
                          </td>
                          <td className="py-4 text-gray-300">{tx.borrower}</td>
                          <td className="py-4 text-white">
                            {tx.lstBTCUsed.toFixed(6)} lstBTC
                          </td>
                          <td className="py-4 text-white">
                            {tx.stablecoinsReceived.toLocaleString()}{" "}
                            {tx.currency}
                          </td>
                          <td className="py-4 text-gray-300">{tx.timestamp}</td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              tx.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>
    </div>
  );
};

export default FlashLoan;
