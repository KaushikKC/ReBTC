"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";
import { FaBitcoin, FaExchangeAlt, FaChevronDown } from "react-icons/fa";
import { BsLightningChargeFill } from "react-icons/bs";

const FlashLoan = () => {
  const [lstBTCAmount, setLstBTCAmount] = useState("");
  const [selectedStablecoin, setSelectedStablecoin] = useState("USDT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const availableLstBTC = 15.5;
  const conversionRate = 65000; // Example rate
  const poolMetrics = {
    availableLiquidity: 1000000,
    utilizationRate: 75
  };

  // Example transaction data
  const recentTransactions = [
    {
      txHash: "0x1234...5678",
      borrower: "0xA12...B34",
      lstBTCUsed: 10,
      stablecoinsReceived: 15000,
      currency: "USDT",
      status: "completed",
      timestamp: "2024-02-15 14:30"
    },
    {
      txHash: "0x5678...9ABC",
      borrower: "0xB34...C56",
      lstBTCUsed: 5,
      stablecoinsReceived: 7500,
      currency: "USDC",
      status: "pending",
      timestamp: "2024-02-15 14:28"
    }
  ];

  const calculateReceiveAmount = () => {
    if (!lstBTCAmount) return 0;
    return (parseFloat(lstBTCAmount) * conversionRate).toFixed(2);
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
                  onChange={e => setLstBTCAmount(e.target.value)}
                  className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                  placeholder="0.00"
                  max={availableLstBTC}
                />
                <button
                  onClick={() => setLstBTCAmount(availableLstBTC)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-3 py-1 rounded-md text-sm hover:bg-[#2F80ED]/80 transition-colors"
                >
                  MAX
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Available: {availableLstBTC} lstBTC
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
                >
                  <span className="text-white">
                    {selectedStablecoin}
                  </span>
                  <FaChevronDown className="text-gray-400" />
                </button>

                <AnimatePresence>
                  {isDropdownOpen &&
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute w-full mt-2 bg-[#2D333B] rounded-lg shadow-xl z-10"
                    >
                      {["USDT", "USDC"].map(coin =>
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
                      )}
                    </motion.div>}
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
            <div className=" p-4 rounded-lg  text-sm text-gray-300">
              ⚠️ Flash loans must be borrowed and repaid within the same
              transaction. Failure to repay will result in transaction
              reversion.
            </div>

            {/* Execute Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!lstBTCAmount || lstBTCAmount <= 0}
              className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
                ${!lstBTCAmount || lstBTCAmount <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#F7931A]/90"}`}
            >
              Execute Flash Loan
            </motion.button>
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
          {/* Flash Loan Form */}

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
                {recentTransactions.map((tx, index) =>
                  <tr key={index} className="border-t border-[#2D333B]">
                    <td className="py-4 text-blue-400">
                      {tx.txHash}
                    </td>
                    <td className="py-4 text-gray-300">
                      {tx.borrower}
                    </td>
                    <td className="py-4 text-white">
                      {tx.lstBTCUsed} lstBTC
                    </td>
                    <td className="py-4 text-white">
                      {tx.stablecoinsReceived.toLocaleString()} {tx.currency}
                    </td>
                    <td className="py-4 text-gray-300">
                      {tx.timestamp}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${tx.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FlashLoan;
