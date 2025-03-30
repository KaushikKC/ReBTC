"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useDataContext } from "@/context/DataContext";

// Import contract constants
import {
  LENDING_CONTRACT_ADDRESS,
  LENDING_CONTRACT_ABI,
  USDC_TOKEN_ADDRESS,
  USDT_TOKEN_ADDRESS,
  TOKEN_ABI,
} from "../../constants/contracts";

const RepaymentModal = ({ loan, onClose, onRepaymentSuccess }) => {
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stablecoinBalance, setStablecoinBalance] = useState(0);

  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Calculate total debt
  const totalDebt = loan.borrowed + (loan.accumulatedInterest || 0);

  // Get stablecoin token address based on loan currency
  const stablecoinAddress = USDT_TOKEN_ADDRESS;

  // Get stablecoin balance
  const { data: balanceData } = useBalance({
    address,
    token: stablecoinAddress,
    watch: true,
  });

  // Update stablecoin balance when balanceData changes
  useEffect(() => {
    if (balanceData) {
      setStablecoinBalance(
        parseFloat(ethers.utils.formatUnits(balanceData.value, 6))
      ); // USDC/USDT use 6 decimals
    }
  }, [balanceData]);

  // Set default repayment amount to total debt
  useEffect(() => {
    setRepaymentAmount(totalDebt.toString());
  }, [totalDebt]);

  // Handle repayment
  const handleRepay = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      toast.error("Please enter a valid repayment amount");
      return;
    }

    if (parseFloat(repaymentAmount) > stablecoinBalance) {
      toast.error(`Insufficient ${loan.currency} balance`);
      return;
    }

    try {
      setIsLoading(true);

      // Get contract instances
      const lendingContract = await getContractInstance(
        LENDING_CONTRACT_ADDRESS,
        LENDING_CONTRACT_ABI
      );

      const stablecoinContract = await getContractInstance(
        stablecoinAddress,
        TOKEN_ABI
      );

      if (!lendingContract || !stablecoinContract) {
        throw new Error("Failed to initialize contracts");
      }

      // Convert repayment amount to wei
      const repaymentAmountWei = ethers.utils.parseUnits(
        repaymentAmount,
        18 // USDC and USDT both use 6 decimals
      );

      // Step 1: Approve stablecoin transfer
      toast.loading(`Approving ${loan.currency} transfer...`);
      const approveTx = await stablecoinContract.approve(
        LENDING_CONTRACT_ADDRESS,
        repaymentAmountWei
      );
      await approveTx.wait();
      toast.dismiss();

      // Step 2: Call repay function with isUSDT flag
      toast.loading(`Repaying ${repaymentAmount} ${loan.currency}...`);

      // Use the repay function with isUSDT flag
      const isUSDT = true;
      const repayTx = await lendingContract.repay(isUSDT, repaymentAmountWei);

      await repayTx.wait();
      toast.dismiss();

      toast.success(`Successfully repaid ${repaymentAmount} ${loan.currency}`);

      // Call onRepaymentSuccess callback if provided
      if (onRepaymentSuccess) {
        onRepaymentSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Repayment error:", error);
      toast.dismiss();

      // Handle specific error messages
      if (error.message.includes("Transfer failed")) {
        toast.error(
          `Failed to transfer ${loan.currency}. Please check your balance and approval.`
        );
      } else if (error.message.includes("exceeds balance")) {
        toast.error(`Insufficient ${loan.currency} balance`);
      } else {
        toast.error(`Failed to repay: ${error.message || "Unknown error"}`);
      }
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
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Repay Loan {loan.id}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Loan Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Borrowed Amount</p>
            <p className="text-xl font-bold text-white">
              {loan.borrowed.toLocaleString()} {loan.currency}
            </p>
          </div>

          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Accumulated Interest</p>
            <p className="text-xl font-bold text-white">
              {(loan.accumulatedInterest || 0).toLocaleString()} {loan.currency}
            </p>
          </div>

          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Total Debt</p>
            <p className="text-xl font-bold text-white">
              {totalDebt.toLocaleString()} {loan.currency}
            </p>
          </div>

          {/* Repayment Amount Input */}
          <div className="bg-[#2D333B] p-4 rounded-lg">
            <label className="block text-gray-400 mb-1">Repayment Amount</label>
            <div className="relative">
              <input
                type="number"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                className="w-full bg-[#373E47] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                placeholder="0.00"
                max={stablecoinBalance}
                disabled={isLoading}
              />
              <button
                onClick={() => setRepaymentAmount(totalDebt.toString())}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-2 py-1 rounded-md text-xs hover:bg-[#2F80ED]/80 transition-colors"
                disabled={isLoading}
              >
                MAX
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Available: {stablecoinBalance.toFixed(2)} {loan.currency}
            </p>
          </div>
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
            onClick={handleRepay}
            disabled={
              !repaymentAmount ||
              parseFloat(repaymentAmount) <= 0 ||
              parseFloat(repaymentAmount) > stablecoinBalance ||
              isLoading
            }
            className={`flex-1 py-4 rounded-lg font-medium transition-colors ${
              !repaymentAmount ||
              parseFloat(repaymentAmount) <= 0 ||
              parseFloat(repaymentAmount) > stablecoinBalance ||
              isLoading
                ? "bg-gray-500 text-white opacity-50 cursor-not-allowed"
                : "bg-[#F7931A] text-white hover:bg-[#F7931A]/90"
            }`}
          >
            {isLoading ? (
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
              `Repay ${repaymentAmount || 0} ${loan.currency}`
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RepaymentModal;
