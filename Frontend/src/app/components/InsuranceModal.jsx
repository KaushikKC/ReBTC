"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaShieldAlt } from "react-icons/fa";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { usePrivy } from "@privy-io/react-auth";
import { useDataContext } from "../../context/DataContext";
import { toast } from "react-hot-toast";
import TimeLoader from "./TimeLoader";

// ABI for the insurance contract
const INSURANCE_CONTRACT_ABI = [
  "function applyForInsurance(uint256 _coverageAmount, string memory _coverageDetails, uint256 _duration) external",
  "function getPremiumRate(uint256 _duration) external view returns (uint256)",
  "function calculatePremium(uint256 _coverageAmount, uint256 _premiumRate, uint256 _duration) external view returns (uint256)",
  "function maxCoveragePerPolicy() external view returns (uint256)",
  "function minCoverageRatio() external view returns (uint256)",
];

// Token ABI for approval
const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// Contract addresses - replace with your actual deployed contract addresses
const INSURANCE_CONTRACT_ADDRESS = "0xC94f840066C6fa664CA96Dc8c8f499B77b7E57ad"; // Replace with your insurance contract address
const LST_BTC_TOKEN_ADDRESS = "0x2EeC315014d29Bf65117aaC32eA6eb165C083cF7"; // Replace with your lstBTC token address

const coverageTypes = [
  {
    id: "liquidation",
    name: "Liquidation Protection",
    details: "Liquidation Protection",
  },
  {
    id: "slashing",
    name: "Slashing Protection",
    details: "Slashing Protection",
  },
  {
    id: "smart-contract",
    name: "Smart Contract Risk",
    details: "Smart Contract Risk",
  },
];

const durationOptions = [
  { days: 30, label: "30 Days" },
  { days: 90, label: "90 Days" },
  { days: 180, label: "180 Days" },
  { days: 365, label: "365 Days" },
];

const InsuranceModal = ({ onClose }) => {
  const [selectedCoverageType, setSelectedCoverageType] = useState(
    coverageTypes[0]
  );
  const [coverageAmount, setCoverageAmount] = useState("");
  const [duration, setDuration] = useState(durationOptions[0].days);
  const [premium, setPremium] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [maxCoverage, setMaxCoverage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const { ready, authenticated, user: privyUser } = usePrivy();
  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Fetch user balance and contract limits when component mounts or address changes
  useEffect(() => {
    if (address) {
      fetchUserBalance();
      fetchContractLimits();
    }
  }, [address]);

  // Fetch premium whenever coverage amount or duration changes
  useEffect(() => {
    if (coverageAmount && parseFloat(coverageAmount) > 0) {
      calculatePremium();
    }
  }, [coverageAmount, duration]);

  // Fetch user's lstBTC balance
  const fetchUserBalance = async () => {
    try {
      const tokenContract = await getContractInstance(
        LST_BTC_TOKEN_ADDRESS,
        TOKEN_ABI
      );

      if (tokenContract) {
        const balance = await tokenContract.balanceOf(address);
        const decimals = await tokenContract.decimals();
        setUserBalance(parseFloat(ethers.utils.formatUnits(balance, decimals)));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Fetch contract limits (max coverage per policy)
  const fetchContractLimits = async () => {
    try {
      const insuranceContract = await getContractInstance(
        INSURANCE_CONTRACT_ADDRESS,
        INSURANCE_CONTRACT_ABI
      );

      if (insuranceContract) {
        const maxCoveragePerPolicy =
          await insuranceContract.maxCoveragePerPolicy();
        setMaxCoverage(
          parseFloat(ethers.utils.formatUnits(maxCoveragePerPolicy, 8))
        );
      }
    } catch (error) {
      console.error("Error fetching contract limits:", error);
    }
  };

  // Calculate premium based on coverage amount and duration
  const calculatePremium = async () => {
    try {
      if (!coverageAmount || parseFloat(coverageAmount) <= 0) return;

      const insuranceContract = await getContractInstance(
        INSURANCE_CONTRACT_ADDRESS,
        INSURANCE_CONTRACT_ABI
      );

      if (insuranceContract) {
        // Convert coverage amount to contract format (8 decimals for BTC)
        const coverageAmountInWei = ethers.utils.parseUnits(
          coverageAmount.toString(),
          8
        );

        // Get premium rate for selected duration
        const premiumRate = await insuranceContract.getPremiumRate(duration);

        // Calculate premium
        const calculatedPremium = await insuranceContract.calculatePremium(
          coverageAmountInWei,
          premiumRate,
          duration
        );

        // Format premium to BTC (8 decimals)
        setPremium(parseFloat(ethers.utils.formatUnits(calculatedPremium, 8)));
      }
    } catch (error) {
      console.error("Error calculating premium:", error);
      // Fallback to a simple calculation if contract call fails
      setPremium(parseFloat(coverageAmount) * 0.02 * (duration / 30));
    }
  };

  const handleMaxClick = () => {
    // Set to max coverage or user balance, whichever is lower
    const maxAmount = Math.min(userBalance, maxCoverage);
    setCoverageAmount(maxAmount.toString());
  };

  const handleApplyForInsurance = async () => {
    if (!authenticated || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!coverageAmount || parseFloat(coverageAmount) <= 0) {
      toast.error("Please enter a valid coverage amount");
      return;
    }

    if (parseFloat(coverageAmount) > maxCoverage) {
      toast.error(`Coverage exceeds maximum allowed (${maxCoverage} BTC)`);
      return;
    }

    if (premium > userBalance) {
      toast.error("Insufficient balance to pay premium");
      return;
    }

    try {
      setIsLoading(true);
      setIsProcessing(true);
      setProcessingStep("Initializing transaction...");

      // Get token contract instance
      const tokenContract = await getContractInstance(
        LST_BTC_TOKEN_ADDRESS,
        TOKEN_ABI
      );

      // Get insurance contract instance
      const insuranceContract = await getContractInstance(
        INSURANCE_CONTRACT_ADDRESS,
        INSURANCE_CONTRACT_ABI
      );

      if (!tokenContract || !insuranceContract) {
        throw new Error("Failed to get contract instances");
      }

      // Convert coverage amount to contract format (8 decimals for BTC)
      const coverageAmountInWei = ethers.utils.parseUnits(
        coverageAmount.toString(),
        8
      );

      // Calculate premium to approve (with a buffer for gas fluctuations)
      const premiumInWei = ethers.utils.parseUnits(
        (premium * 1.05).toFixed(8), // 5% buffer
        8
      );

      // First approve the insurance contract to spend tokens
      setProcessingStep("Approving token transfer...");
      const approveTx = await tokenContract.approve(
        INSURANCE_CONTRACT_ADDRESS,
        premiumInWei
      );

      toast.loading("Approving token transfer...");
      await approveTx.wait();
      toast.dismiss();

      // Now apply for insurance
      setProcessingStep("Creating insurance policy...");
      const insuranceTx = await insuranceContract.applyForInsurance(
        coverageAmountInWei,
        selectedCoverageType.details,
        duration
      );

      toast.loading("Creating insurance policy...");
      await insuranceTx.wait();
      toast.dismiss();

      // Success
      setIsSuccess(true);
      setProcessingStep("Insurance policy created successfully!");
      toast.success("Insurance policy created successfully!");

      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Insurance application error:", error);
      toast.error(
        `Failed to create policy: ${error.message || "Unknown error"}`
      );
      setIsProcessing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Opt-In Insurance</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Insurance Form */}
        <div className="space-y-4 mb-6">
          {/* Coverage Type Selection */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm mb-2">
              Coverage Type
            </label>
            <div className="relative">
              <select
                value={selectedCoverageType.id}
                onChange={(e) =>
                  setSelectedCoverageType(
                    coverageTypes.find((type) => type.id === e.target.value)
                  )
                }
                className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                disabled={isLoading}
              >
                {coverageTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coverage Amount Input */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm mb-2">
              Coverage Amount (lstBTC)
            </label>
            <div className="relative">
              <input
                type="number"
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(e.target.value)}
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

            {/* Balance Display */}
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-400">Available Balance:</span>
              <span className="text-white">
                {userBalance.toFixed(6)} lstBTC
              </span>
            </div>

            {/* Max Coverage Display */}
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-400">Max Coverage:</span>
              <span className="text-white">
                {maxCoverage.toFixed(6)} lstBTC
              </span>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm mb-2">
              Coverage Duration
            </label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                disabled={isLoading}
              >
                {durationOptions.map((option) => (
                  <option key={option.days} value={option.days}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Premium Display */}
          <motion.div
            animate={{ opacity: coverageAmount ? 1 : 0.5 }}
            className="bg-[#2D333B] p-4 rounded-lg mb-6"
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Premium Required</span>
              <span className="text-[#F7931A] font-bold">
                {premium.toFixed(8)} BTC
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-300">Coverage Period</span>
              <span className="text-white">{duration} days</span>
            </div>
          </motion.div>

          {/* Validation Messages */}
          {parseFloat(coverageAmount) > maxCoverage &&
            coverageAmount !== "" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm mb-4"
              >
                Coverage exceeds maximum allowed ({maxCoverage} lstBTC)
              </motion.div>
            )}

          {premium > userBalance && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mb-4"
            >
              Insufficient balance to pay premium
            </motion.div>
          )}

          {/* Authentication Check */}
          {!authenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-yellow-400 text-sm mb-4"
            >
              Please connect your wallet to purchase insurance
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 bg-[#2D333B] text-white py-4 rounded-lg font-medium hover:bg-[#2D333B]/80 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplyForInsurance}
            disabled={
              isLoading ||
              !authenticated ||
              !coverageAmount ||
              parseFloat(coverageAmount) <= 0 ||
              parseFloat(coverageAmount) > maxCoverage ||
              premium > userBalance
            }
            className={`flex-1 ${
              isLoading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#F7931A] hover:bg-[#F7931A]/90 cursor-pointer"
            } text-white py-4 rounded-lg font-medium transition-colors`}
          >
            {isLoading ? "Processing..." : "Purchase Insurance"}
          </motion.button>
        </div>

        {/* Processing Overlay */}
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
    </motion.div>
  );
};

export default InsuranceModal;
