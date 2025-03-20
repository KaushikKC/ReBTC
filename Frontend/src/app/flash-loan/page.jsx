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

const FlashLoan = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lstBTCAmount, setLstBTCAmount] = useState("");
  const [selectedStablecoin, setSelectedStablecoin] = useState("USDT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  const { authenticated, user: privyUser } = usePrivy();
  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Get lstBTC balance
  const { data: lstBtcBalanceData } = useBalance({
    address,
    token: LSTBTC_TOKEN_ADDRESS,
    watch: true,
  });

  const availableLstBTC = lstBtcBalanceData
    ? parseFloat(ethers.utils.formatUnits(lstBtcBalanceData.value, 18))
    : 0;

  const conversionRate = 65000;
  const poolMetrics = {
    availableLiquidity: 1000000,
    utilizationRate: 75,
  };

  // Add loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Example transaction data
  const [recentTransactions, setRecentTransactions] = useState([
    {
      txHash: "0x1234...5678",
      borrower: "0xA12...B34",
      lstBTCUsed: 10,
      stablecoinsReceived: 15000,
      currency: "USDT",
      status: "completed",
      timestamp: "2024-02-15 14:30",
    },
    {
      txHash: "0x5678...9ABC",
      borrower: "0xB34...C56",
      lstBTCUsed: 5,
      stablecoinsReceived: 7500,
      currency: "USDC",
      status: "pending",
      timestamp: "2024-02-15 14:28",
    },
  ]);

  const calculateReceiveAmount = () => {
    if (!lstBTCAmount) return 0;
    return (parseFloat(lstBTCAmount) * conversionRate).toFixed(2);
  };

  const executeFlashLoan = async () => {
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

      // Step 2: Execute the flash loan
      toast.loading("Executing flash loan...");

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
      };

      setRecentTransactions([newTransaction, ...recentTransactions]);

      // Reset form
      setLstBTCAmount("");

      toast.success("Flash loan executed successfully!");
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
          <p className="text-white mt-4 font-['Quantify']">
            Loading Flash loans
          </p>
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
                        1 lstBTC = {conversionRate} {selectedStablecoin}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">You'll Receive</p>
                      <p className="text-xl font-bold text-white">
                        {calculateReceiveAmount()} {selectedStablecoin}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <div className="p-4 rounded-lg text-sm text-gray-300">
                  ⚠️ Flash loans must be borrowed and repaid within the same
                  transaction. Failure to repay will result in transaction
                  reversion.
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
                  onClick={executeFlashLoan}
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
                    "Execute Flash Loan"
                  )}
                </motion.button>

                {!authenticated && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Please connect your wallet to execute a flash loan
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
                  <h3 className="text-gray-300 mb-2">Available Liquidity</h3>
                  <p className="text-2xl font-bold text-white">
                    ${poolMetrics.availableLiquidity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#1C2128] p-6 rounded-xl shadow-lg">
                  <h3 className="text-gray-300 mb-2">Utilization Rate</h3>
                  <p className="text-2xl font-bold text-white">
                    {poolMetrics.utilizationRate}%
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
                <h2 className="text-xl font-bold text-white mb-6">
                  Recent Transactions
                </h2>
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-4">Tx Hash</th>
                      <th className="pb-4">Borrower</th>
                      <th className="pb-4">lstBTC Used</th>
                      <th className="pb-4">Stablecoins Received</th>
                      <th className="pb-4">Time</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx, index) => (
                      <tr key={index} className="border-t border-[#2D333B]">
                        <td className="py-4 text-blue-400">{tx.txHash}</td>
                        <td className="py-4 text-gray-300">{tx.borrower}</td>
                        <td className="py-4 text-white">
                          {tx.lstBTCUsed} lstBTC
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
