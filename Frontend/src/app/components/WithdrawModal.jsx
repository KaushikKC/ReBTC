"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaBolt, FaClock } from "react-icons/fa";

const WithdrawModal = ({ onClose, availableBalance }) => {
  const [amount, setAmount] = useState("");
  const [withdrawalType, setWithdrawalType] = useState("fast");

  const handleWithdraw = () => {
    // Add withdrawal logic here
    console.log("Withdrawing:", amount, "Type:", withdrawalType);
    onClose();
  };

  const handleMaxClick = () => {
    setAmount(availableBalance.toString());
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
        onClick={e => e.stopPropagation()}
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7931A] transition-all"
              placeholder="0.00"
              max={availableBalance}
            />
            <button
              onClick={handleMaxClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#F7931A] text-white px-3 py-1 rounded-md text-sm hover:bg-[#F7931A]/80 transition-colors"
            >
              MAX
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Available: {availableBalance} BTC
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
              className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors
                ${withdrawalType === "fast"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#2D333B] text-gray-300"}`}
            >
              <FaBolt className="text-xl" />
              <span>Fast</span>
              <span className="text-xs opacity-75">0.1% fee</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWithdrawalType("standard")}
              className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors
                ${withdrawalType === "standard"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#2D333B] text-gray-300"}`}
            >
              <FaClock className="text-xl" />
              <span>Standard</span>
              <span className="text-xs opacity-75">24-48h</span>
            </motion.button>
          </div>
        </div>

        {/* Withdraw Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWithdraw}
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance
          }
          className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
            ${!amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[#F7931A]/90"}`}
        >
          Confirm Withdrawal
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default WithdrawModal;
