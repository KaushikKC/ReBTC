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
import { toast } from "react-hot-toast";
import TimeLoader from "../components/TimeLoader";
import Footer from "../components/Footer";
// ABI for the deposit contract
const DEPOSIT_CONTRACT_ABI = [
  "function depositBTC(uint256 amount) external",
  "function depositWETH(uint256 amount) external",
  "function btcTotalValueLocked() external view returns (uint256)",
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

  // Fetch user balances for all tokens
  const fetchUserBalances = async () => {
    try {
      const balances = {};

      for (const crypto of cryptoOptions) {
        const tokenContract = await getContractInstance(
          crypto.tokenAddress,
          TOKEN_ABI
        );

        if (tokenContract) {
          const balance = await tokenContract.balanceOf(address);
          const decimals = await tokenContract.decimals();

          // Format balance based on token decimals
          balances[crypto.id] = ethers.utils.formatUnits(balance, decimals);
        }
      }

      setUserBalances(balances);
    } catch (error) {
      console.error("Error fetching balances:", error);
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
        const btcTVL = await depositContract.btcTotalValueLocked();
        const wethTVL = await depositContract.wethTotalValueLocked();

        setTvl({
          btc: ethers.utils.formatUnits(btcTVL, 8), // BTC has 8 decimals
          wbtc: ethers.utils.formatUnits(btcTVL, 8), // WBTC has 8 decimals
          weth: ethers.utils.formatUnits(wethTVL, 18), // WETH has 18 decimals
        });
      }
    } catch (error) {
      console.error("Error fetching TVL:", error);
    }
  };

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
      await depositTx.wait();
      toast.dismiss();

      toast.success(`Successfully deposited ${amount} ${selectedCrypto.name}`);

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

      <div className="flex-grow flex justify-center px-4 pt-32">
        <div className="flex flex-wrap justify-center pb-16 gap-4 md:gap-8 w-full max-w-7xl">
          <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
          <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
          <SqueezeButton text={"Instant Liquidity"} to="/flash-loan" />
          <SqueezeButton text={"BTC Insurance Pool"} to="/insurance" />
        </div>
      </div>

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

      {/* Page-wide Gradient Effects */}
      {/* <motion.div
        className="fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2F80ED]/10 rounded-full filter blur-[100px] transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F7931A]/10 rounded-full filter blur-[100px] transform translate-x-1/2 translate-y-1/2" />
      </motion.div> */}
    </div>
  );
}

export default Deposit;
