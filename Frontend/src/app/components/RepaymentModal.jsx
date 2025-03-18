"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const RepaymentModal = ({ loan, onClose }) => {
  const totalRepayment = loan.borrowed * (1 + loan.interest / 100);

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
          <h2 className="text-xl font-bold text-white">
            Repay Loan {loan.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
            <p className="text-gray-400 mb-1">
              Interest ({loan.interest}%)
            </p>
            <p className="text-xl font-bold text-white">
              {(loan.borrowed * loan.interest / 100).toLocaleString()}{" "}
              {loan.currency}
            </p>
          </div>

          <div className="bg-[#2D333B] p-4 rounded-lg">
            <p className="text-gray-400 mb-1">Total Repayment</p>
            <p className="text-xl font-bold text-white">
              {totalRepayment.toLocaleString()} {loan.currency}
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
            Confirm Repayment
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RepaymentModal;
