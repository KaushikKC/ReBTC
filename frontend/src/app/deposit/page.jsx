"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import Navbar from "../components/Navbar";
import yieldbox from "../assets/yieldbox.svg";
import SqueezeButton from "../components/SqueezeButton";
import Image from "next/image";
import UserDepositsOverview from "../components/UserDepositsOverview";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";
import { useDataContext } from "../../context/DataContext";
import { toast, Toaster } from "react-hot-toast";
import TimeLoader from "../components/TimeLoader";
import Footer from "../components/Footer";
import { SiStreamrunners } from "react-icons/si";
import Button from "../components/Button";
import Link from "next/link";
import AIPreferencesModal from "../components/AIPreferencesModal";

// ABI for the deposit contract
const DEPOSIT_CONTRACT_ABI = [
  "function depositBTC(uint256 amount) external",
  "function depositWETH(uint256 amount) external",
  "function btcTotaslValueLocked() external view returns (uint256)",
  "function wethTotalValueLocked() external view returns (uint256)",
  "function userBtcDeposits(address user) external view returns (uint256 amount, uint256 depositTimestamp)",
  "function userWethDeposits(address user) external view returns (uint256 amount, uint256 depositTimestamp)",
];

// Token ABIs for approval
const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// Contract addresses - replace with your actual deployed contract addresses
const DEPOSIT_CONTRACT_ADDRESS = "0x7d4829CC2a64517E52F538a2bDD83841Dcf8349b"; // Replace with your contract address
const BTC_TOKEN_ADDRESS = "0x579721ACfFeDD19dC61685d496E68ee346aA100a"; // Replace with BTC token address
const WBTC_TOKEN_ADDRESS = "0x789..."; // Replace with WBTC token address
const WETH_TOKEN_ADDRESS = "0x9e42e9D0f548314415833C5F3d69C95774E6c395"; // Replace with WETH token address

const cryptoOptions = [
  { id: "btc", name: "BTC", tokenAddress: BTC_TOKEN_ADDRESS, decimals: 8 },
  { id: "wbtc", name: "wBTC", tokenAddress: WBTC_TOKEN_ADDRESS, decimals: 8 },
  { id: "weth", name: "WETH", tokenAddress: WETH_TOKEN_ADDRESS, decimals: 18 },
];

function Deposit() {
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [apy, setApy] = useState(12.5); // Example APY
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalances, setUserBalances] = useState({});
  const [tvl, setTvl] = useState({ btc: "0", wbtc: "0", weth: "0" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    riskTolerance: "high",
    profitMargin: 0.09,
    monitoringPeriod: "1 month",
  });
  const { ready, authenticated, user: privyUser } = usePrivy();
  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Fetch user balances and TVL when component mounts or address changes
  useEffect(() => {
    if (address) {
      fetchUserBalances();
      fetchTVL();
    }
  }, [address]);

  // Add this constant for profile transactions storage
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

  // Fetch user balances for all tokens
  // Fetch user balances for all tokens
  const fetchUserBalances = async () => {
    try {
      setIsInitialLoading(true);
      const balances = {};

      for (const crypto of cryptoOptions) {
        try {
          const tokenContract = await getContractInstance(
            crypto.tokenAddress,
            TOKEN_ABI
          );

          if (tokenContract) {
            const balance = await tokenContract.balanceOf(address);

            // Format balance based on token decimals
            balances[crypto.id] = ethers.utils.formatUnits(
              balance,
              crypto.decimals
            );
            console.log(`Fetched ${crypto.id} balance:`, balances[crypto.id]);
          } else {
            console.warn(`Could not get contract instance for ${crypto.id}`);
          }
        } catch (err) {
          console.error(`Error fetching balance for ${crypto.id}:`, err);
          balances[crypto.id] = "0";
        }
      }

      console.log("All user balances:", balances);
      setUserBalances(balances);
    } catch (error) {
      console.error("Error in fetchUserBalances:", error);
      // Set default values to prevent UI from breaking
      setUserBalances({
        btc: "0",
        wbtc: "0",
        weth: "0",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Fetch Total Value Locked from the contract
  const fetchTVL = async () => {
    try {
      const depositContract = await getContractInstance(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI
      );

      if (depositContract) {
        try {
          const btcTVL = await depositContract.btcTotalValueLocked();
          console.log("Raw BTC TVL:", btcTVL.toString());

          let wethTVL;
          try {
            wethTVL = await depositContract.wethTotalValueLocked();
            console.log("Raw WETH TVL:", wethTVL.toString());
          } catch (wethErr) {
            console.error("Error fetching WETH TVL:", wethErr);
            wethTVL = ethers.BigNumber.from(0);
          }

          setTvl({
            btc: ethers.utils.formatUnits(btcTVL, 8), // BTC has 8 decimals
            wbtc: ethers.utils.formatUnits(btcTVL, 8), // WBTC has 8 decimals
            weth: ethers.utils.formatUnits(wethTVL, 18), // WETH has 18 decimals
          });

          console.log("Formatted TVL values:", {
            btc: ethers.utils.formatUnits(btcTVL, 8),
            weth: ethers.utils.formatUnits(wethTVL, 18),
          });
        } catch (err) {
          console.error("Error calling TVL methods:", err);
          // Check if there's a typo in the contract method name
          console.log(
            "Available contract methods:",
            Object.keys(depositContract.functions)
          );

          // Set default values
          setTvl({
            btc: "0",
            wbtc: "0",
            weth: "0",
          });
        }
      } else {
        console.error("Could not get deposit contract instance");
      }
    } catch (error) {
      console.error("Error in fetchTVL:", error);
      // Set default values to prevent UI from breaking
      setTvl({
        btc: "0",
        wbtc: "0",
        weth: "0",
      });
    }
  };

  // Update useEffect to ensure it runs properly
  useEffect(() => {
    if (address) {
      console.log("Fetching balances and TVL for address:", address);
      fetchUserBalances();
      fetchTVL();
    } else {
      console.log("No wallet address available");
      // Set default values when no address is available
      setUserBalances({
        btc: "0",
        wbtc: "0",
        weth: "0",
      });
      setTvl({
        btc: "0",
        wbtc: "0",
        weth: "0",
      });
    }
  }, [address]);
  const handleMaxClick = () => {
    if (userBalances[selectedCrypto.id]) {
      setAmount(userBalances[selectedCrypto.id]);
    }
  };

  const calculateProjectedApy = (amount) => {
    // This is a placeholder calculation - replace with actual APY logic
    return amount ? ((parseFloat(amount) * apy) / 100).toFixed(4) : "0.0000";
  };

  const handleDeposit = async () => {
    if (!authenticated || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) < 0.01) {
      toast.error(`Minimum deposit required: 0.01 ${selectedCrypto.name}`);
      return;
    }

    try {
      setIsLoading(true);

      // Get token contract instance
      const tokenContract = await getContractInstance(
        selectedCrypto.tokenAddress,
        TOKEN_ABI
      );

      // Get deposit contract instance
      const depositContract = await getContractInstance(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI
      );

      if (!tokenContract || !depositContract) {
        throw new Error("Failed to get contract instances");
      }

      // Convert amount to token units based on decimals
      const amountInWei = ethers.utils.parseUnits(
        amount,
        selectedCrypto.decimals
      );

      // First approve the deposit contract to spend tokens
      const approveTx = await tokenContract.approve(
        DEPOSIT_CONTRACT_ADDRESS,
        amountInWei
      );

      toast.loading("Approving token transfer...");
      await approveTx.wait();
      toast.dismiss();

      // Now deposit the tokens
      let depositTx;

      if (selectedCrypto.id === "btc" || selectedCrypto.id === "wbtc") {
        depositTx = await depositContract.depositBTC(amountInWei);
      } else if (selectedCrypto.id === "weth") {
        depositTx = await depositContract.depositWETH(amountInWei);
      }

      toast.loading(`Depositing ${selectedCrypto.name}...`);
      const receipt = await depositTx.wait();
      toast.dismiss();

      // Success toast for the deposit
      toast.success(`Successfully deposited ${amount} ${selectedCrypto.name}`);

      // Add a separate toast for ReBTC receipt with transaction ID
      const shortenedTxId = `${receipt.transactionHash.substring(
        0,
        6
      )}...${receipt.transactionHash.substring(62)}`;
      toast.success(
        <div>
          <p>Received ReBTC in your wallet!</p>
          <p className="text-xs mt-1">
            Transaction ID: <span className="font-mono">{shortenedTxId}</span>
          </p>
          <p className="text-xs mt-1">
            <a
              href={`https://scan.test2.btcs.network/tx/${receipt.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              View on Etherscan
            </a>
          </p>
        </div>,
        {
          duration: 6000, // Show for 6 seconds
          style: {
            border: "1px solid #F7931A",
            padding: "16px",
          },
          icon: "🔄",
        }
      );

      // Save transaction to profile storage
      const profileTransaction = {
        hash: receipt.transactionHash,
        reBtcUsed: parseFloat(amount), // Now tracking ReBTC received
        stablecoins: parseFloat(amount),
        currency: selectedCrypto.name,
        status: "Completed",
        type: "Deposit",
        description: `Deposited ${amount} ${selectedCrypto.name} and received ReBTC`,
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

      // Refresh balances and TVL
      fetchUserBalances();
      fetchTVL();

      // Reset amount
      setAmount("");
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error(`Failed to deposit: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
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
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] flex flex-col">
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#2D333B",
            color: "#fff",
            border: "1px solid #373E47",
          },
          success: {
            iconTheme: {
              primary: "#F7931A",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff4b4b",
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="flex-grow flex justify-center px-4 pt-32">
        <div className="flex flex-wrap justify-center pb-16 gap-4 md:gap-8 w-full max-w-7xl">
          <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
          <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
          <SqueezeButton text={"Instant Liquidity"} to="/flash-loan" />
          <SqueezeButton text={"BTC Insurance Pool"} to="/insurance" />
        </div>
      </div>
      {/* <div className="w-full flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F7931A] to-[#2F80ED] text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          <span>Create AI Agent</span>
          <SiStreamrunners />
        </motion.button>
      </div> */}

      <div className="px-4 md:px-8 space-y-8 pb-5">
        {/* User Deposits Overview */}
        <UserDepositsOverview />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto bg-[#1C2128] rounded-xl p-6 shadow-lg relative"
      >
        {/* Asset Selection Section */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Select Asset
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-[#2D333B] p-4 rounded-lg hover:bg-[#373E47] transition-colors"
            >
              <span className="text-white">{selectedCrypto.name}</span>
              <FaChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute w-full mt-2 bg-[#2D333B] rounded-lg shadow-xl z-10"
              >
                {cryptoOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedCrypto(option);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#373E47] text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Balance Display */}
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-400">Available Balance:</span>
            <span className="text-white">
              {userBalances[selectedCrypto.id]
                ? parseFloat(userBalances[selectedCrypto.id]).toFixed(6)
                : "0.000000"}{" "}
              {selectedCrypto.name}
            </span>
          </div>

          {/* TVL Display */}
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-gray-400">Total Value Locked:</span>
            <span className="text-white">
              {tvl[selectedCrypto.id]
                ? parseFloat(tvl[selectedCrypto.id]).toFixed(6)
                : "0.000000"}{" "}
              {selectedCrypto.name}
            </span>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Enter Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
              placeholder="0.00"
              disabled={isLoading}
            />
            <button
              onClick={handleMaxClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-3 py-1 rounded-md text-sm hover:bg-[#2F80ED]/80 transition-colors"
              disabled={isLoading}
            >
              MAX
            </button>
          </div>
        </div>

        {/* APY Section */}
        <motion.div
          animate={{ opacity: amount ? 1 : 0.5 }}
          className="bg-[#2D333B] p-4 rounded-lg mb-6"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Projected APY</span>
            <span className="text-[#2F80ED] font-bold">{apy}%</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-300">Projected Earnings</span>
            <span className="text-white">
              {calculateProjectedApy(amount)} {selectedCrypto.name}/year
            </span>
          </div>
        </motion.div>

        {/* Minimum Deposit Notice */}
        {parseFloat(amount) < 0.01 && amount !== "" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4"
          >
            Minimum deposit required: 0.01 {selectedCrypto.name}
          </motion.div>
        )}

        {/* Authentication Check */}
        {!authenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-yellow-400 text-sm mb-4"
          >
            Please connect your wallet to deposit
          </motion.div>
        )}

        {/* Deposit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full ${
            isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#F7931A] hover:bg-[#F7931A]/90 cursor-pointer"
          } text-white py-4 rounded-lg font-medium transition-colors`}
          onClick={handleDeposit}
          disabled={isLoading || !authenticated}
        >
          {isLoading ? "Processing..." : `Deposit ${selectedCrypto.name}`}
        </motion.button>
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1C2128]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
            >
              {!isSuccess ? (
                <>
                  <TimeLoader />
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white font-medium"
                  >
                    {processingStep}
                  </motion.p>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="text-[#4CAF50] text-5xl">✓</div>
                  <p className="text-white font-medium">{processingStep}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.0 }}
        transition={{ duration: 0.6 }}
        className="text-center text-[35px] font-bold text-white tracking-wide relative pt-16"
      >
        <span className="relative inline-block">
          Live Yield Simulation Box
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/20 via-[#F7931A]/20 to-[#2F80ED]/20 blur-xl -z-10"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </span>
      </motion.h2>
      <div className="flex justify-center">
        <Image
          src={yieldbox}
          alt="yeild"
          className="w-full max-w-[1200px] px-6 "
          priority
        />
      </div>
      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <AIPreferencesModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            preferences={preferences}
            setPreferences={setPreferences}
          />
        </motion.div>
      )}
    </div>
  );
}

export default Deposit;
