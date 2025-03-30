"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaBolt, FaClock } from "react-icons/fa";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useDataContext } from "@/context/DataContext";
import { toast } from "react-hot-toast";

// Import contract addresses and ABIs from constants
import {
  DEPOSIT_CONTRACT_ADDRESS,
  DEPOSIT_CONTRACT_ABI,
  BTC_TOKEN_ADDRESS,
  WETH_TOKEN_ADDRESS,
} from "../../constants/contracts";

const WithdrawModal = ({
  onClose,
  availableBalance,
  onWithdrawSuccess,
  assetType = "btc",
}) => {
  const [amount, setAmount] = useState("");
  const [withdrawalType, setWithdrawalType] = useState("fast");
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawFee, setWithdrawFee] = useState(0);
  const [estimatedReceived, setEstimatedReceived] = useState(0);

  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Calculate fee and estimated amount on amount or withdrawal type change
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const amountValue = parseFloat(amount);
      let fee = 0;

      if (withdrawalType === "fast") {
        fee = amountValue * 0.001; // 0.1% fee for fast withdrawal
      }

      setWithdrawFee(fee);
      setEstimatedReceived(amountValue - fee);
    } else {
      setWithdrawFee(0);
      setEstimatedReceived(0);
    }
  }, [amount, withdrawalType]);

  const handleWithdraw = async () => {
    if (
      !address ||
      !amount ||
      parseFloat(amount) <= 0 ||
      parseFloat(amount) > availableBalance
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Get contract instance
      const depositContract = await getContractInstance(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI
      );

      if (!depositContract) {
        throw new Error("Failed to initialize contract");
      }

      // Convert amount to token units based on asset type
      const decimals = 18; // BTC/WBTC use 8 decimals, WETH uses 18
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      // Call the appropriate withdraw function based on asset type and withdrawal type
      let tx;

      if (assetType === "weth") {
        // WETH withdrawal
        if (withdrawalType === "fast") {
          tx = await depositContract.withdrawWETH(amountInWei);
        } else {
          tx = await depositContract.withdrawWETH(amountInWei);
        }
      } else {
        // BTC/WBTC withdrawal
        if (withdrawalType === "fast") {
          tx = await depositContract.withdrawBTC(amountInWei);
        } else {
          tx = await depositContract.withdrawBTC(amountInWei);
        }
      }

      // Show loading toast
      toast.loading(
        `Processing ${withdrawalType} withdrawal of ${amount} ${assetType.toUpperCase()}...`
      );

      // Wait for transaction to be mined
      await tx.wait();

      // Show success toast
      toast.dismiss();
      toast.success(
        `Successfully initiated withdrawal of ${amount} ${assetType.toUpperCase()}`
      );

      // If standard withdrawal, show additional info
      if (withdrawalType === "standard") {
        toast.success("Your funds will be available in 24-48 hours", {
          duration: 5000,
        });
      }

      // Call the success callback to refresh data
      if (onWithdrawSuccess) {
        onWithdrawSuccess();
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.dismiss();
      toast.error(`Failed to withdraw: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    // For fast withdrawal, account for the fee
    if (withdrawalType === "fast") {
      // Calculate max amount that can be withdrawn after fee
      // Formula: maxAmount = availableBalance / 1.001 (to account for 0.1% fee)
      const maxAmount = availableBalance / 1.001;
      setAmount(maxAmount.toFixed(8)); // 8 decimal places for BTC
    } else {
      setAmount(availableBalance.toString());
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
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Withdrawal Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7931A] transition-all"
              placeholder="0.00"
              max={availableBalance}
              disabled={isLoading}
            />
            <button
              onClick={handleMaxClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#F7931A] text-white px-3 py-1 rounded-md text-sm hover:bg-[#F7931A]/80 transition-colors"
              disabled={isLoading}
            >
              MAX
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Available: {availableBalance} {assetType.toUpperCase()}
          </p>
        </div>

        {/* Withdrawal Type Selection */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Withdrawal Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWithdrawalType("fast")}
              disabled={isLoading}
              className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors
                ${
                  withdrawalType === "fast"
                    ? "bg-[#2F80ED] text-white"
                    : "bg-[#2D333B] text-gray-300"
                }`}
            >
              <FaBolt className="text-xl" />
              <span>Fast</span>
              <span className="text-xs opacity-75">0.1% fee</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWithdrawalType("standard")}
              disabled={isLoading}
              className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors
                ${
                  withdrawalType === "standard"
                    ? "bg-[#2F80ED] text-white"
                    : "bg-[#2D333B] text-gray-300"
                }`}
            >
              <FaClock className="text-xl" />
              <span>Standard</span>
              <span className="text-xs opacity-75">24-48h</span>
            </motion.button>
          </div>
        </div>

        {/* Withdrawal Summary */}
        {amount && parseFloat(amount) > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 bg-[#2D333B] p-4 rounded-lg"
          >
            <h3 className="text-gray-300 mb-2">Withdrawal Summary</h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white">
                {parseFloat(amount).toFixed(8)} {assetType.toUpperCase()}
              </span>
            </div>
            {withdrawalType === "fast" && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Fee (0.1%):</span>
                <span className="text-white">
                  {withdrawFee.toFixed(8)} {assetType.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-gray-700 mt-1">
              <span className="text-gray-400">You will receive:</span>
              <span className="text-white font-medium">
                {estimatedReceived.toFixed(8)} {assetType.toUpperCase()}
              </span>
            </div>
          </motion.div>
        )}

        {/* Withdraw Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWithdraw}
          disabled={
            isLoading ||
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance
          }
          className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
            ${
              isLoading ||
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > availableBalance
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#F7931A]/90"
            }`}
        >
          {isLoading ? "Processing..." : "Confirm Withdrawal"}
        </motion.button>

        {/* Additional Info */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          {withdrawalType === "fast"
            ? "Fast withdrawals are processed immediately with a 0.1% fee"
            : "Standard withdrawals take 24-48 hours to process with no fee"}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default WithdrawModal;
