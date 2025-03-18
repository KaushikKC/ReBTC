"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const InsuranceModal = ({ onClose }) => {
  const [coverageType, setCoverageType] = useState("liquidation");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [premium, setPremium] = useState(0);

  // Calculate premium (example: 2% of coverage amount)
  const calculatePremium = amount => {
    return amount * 0.02;
  };

  const handleCoverageAmountChange = e => {
    const amount = parseFloat(e.target.value);
    setCoverageAmount(amount);
    setPremium(calculatePremium(amount));
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
          <h2 className="text-xl font-bold text-white">Opt-In Insurance</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Insurance Form */}
        <div className="space-y-4 mb-6">
          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Coverage Type</p>
            <select
              value={coverageType}
              onChange={e => setCoverageType(e.target.value)}
              className="w-full bg-[#1C2128] text-white p-2 rounded-md"
            >
              <option value="liquidation">Liquidation Protection</option>
              <option value="slashing">Slashing Protection</option>
              <option value="smart-contract">Smart Contract Risk</option>
            </select>
          </div>

          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Coverage Amount (BTC)</p>
            <input
              type="number"
              value={coverageAmount}
              onChange={handleCoverageAmountChange}
              className="w-full bg-[#1C2128] text-white p-2 rounded-md"
              placeholder="Enter amount"
            />
          </div>

          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Premium Required</p>
            <p className="text-xl font-bold text-white">
              {premium.toFixed(8)} BTC
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
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#F7931A] text-white py-4 rounded-lg font-medium hover:bg-[#F7931A]/90 transition-colors"
          >
            Purchase Insurance
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InsuranceModal;
