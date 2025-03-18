"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBitcoin, FaChartLine, FaClock } from "react-icons/fa";
import WithdrawModal from "./WithdrawModal";

const UserDepositsOverview = () => {
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositStats, setDepositStats] = useState({
    totalDeposited: 0.5,
    earnings: 0.05,
    nextPayout: "2024-02-20"
  });

  const handleReinvest = () => {
    // Add reinvestment logic here
    setDepositStats(prev => ({
      ...prev,
      totalDeposited: prev.totalDeposited + prev.earnings,
      earnings: 0
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        {/* Total Deposited Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center mb-2">
            <FaBitcoin className="text-[#F7931A] text-xl mr-2" />
            <h3 className="text-gray-300">Total Deposited</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {depositStats.totalDeposited} BTC
          </p>
        </motion.div>

        {/* Earnings Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center mb-2">
            <FaChartLine className="text-[#2F80ED] text-xl mr-2" />
            <h3 className="text-gray-300">Accumulated Earnings</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {depositStats.earnings} BTC
          </p>
        </motion.div>

        {/* Next Payout Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center mb-2">
            <FaClock className="text-[#F7931A] text-xl mr-2" />
            <h3 className="text-gray-300">Next Payout</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {new Date(depositStats.nextPayout).toLocaleDateString()}
          </p>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setWithdrawModalOpen(true)}
          className="flex-1 bg-[#F7931A] text-white py-4 px-6 rounded-lg font-medium hover:bg-[#F7931A]/90 transition-colors"
        >
          Withdraw Funds
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReinvest}
          disabled={depositStats.earnings <= 0}
          className={`flex-1 bg-[#2F80ED] text-white py-4 px-6 rounded-lg font-medium transition-colors
            ${depositStats.earnings <= 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[#2F80ED]/90"}`}
        >
          Reinvest Earnings
        </motion.button>
      </motion.div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen &&
          <WithdrawModal
            onClose={() => setWithdrawModalOpen(false)}
            availableBalance={
              depositStats.totalDeposited + depositStats.earnings
            }
          />}
      </AnimatePresence>
    </div>
  );
};

export default UserDepositsOverview;
