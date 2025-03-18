"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";
import { FaBitcoin, FaChevronDown, FaExchangeAlt } from "react-icons/fa";
import RepaymentModal from "../components/RepaymentModal";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const StablecoinLoan = () => {
  const [collateralAmount, setCollateralAmount] = useState("");
  const [selectedStablecoin, setSelectedStablecoin] = useState("USDC");
  const [ltvPercentage, setLtvPercentage] = useState(50);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const MAX_LTV = 75;
  const btcPrice = 65000; // Example price, should be fetched from API
  const availableBtcBalance = 2.5;

  const calculateLoanAmount = () => {
    if (!collateralAmount) return 0;
    return collateralAmount * btcPrice * ltvPercentage / 100;
  };

  const calculateInterestRate = () => {
    const ltv = ltvPercentage;
    if (ltv <= 50) return 2;
    if (ltv <= 65) return 2.5;
    return 3;
  };

  // Example loan positions data
  const loanPositions = [
    {
      id: "#001",
      collateral: 0.5,
      borrowed: 15000,
      currency: "USDC",
      interest: 2,
      dueDate: "2025-04-01",
      status: "active"
    },
    {
      id: "#002",
      collateral: 1.0,
      borrowed: 30000,
      currency: "USDT",
      interest: 1.8,
      dueDate: "2025-04-07",
      status: "overdue"
    }
  ];

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
          {/* Borrowing Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg"
          >
            {/* Collateral Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                BTC Collateral Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={collateralAmount}
                  onChange={e => setCollateralAmount(e.target.value)}
                  className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                  placeholder="0.00"
                  max={availableBtcBalance}
                />
                <button
                  onClick={() => setCollateralAmount(availableBtcBalance)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-3 py-1 rounded-md text-sm hover:bg-[#2F80ED]/80 transition-colors"
                >
                  MAX
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Available: {availableBtcBalance} BTC
              </p>
            </div>

            {/* LTV Slider */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                Loan to Value (LTV) - {ltvPercentage}%
              </label>
              <Slider
                min={1}
                max={MAX_LTV}
                value={ltvPercentage}
                onChange={setLtvPercentage}
                trackStyle={{ backgroundColor: "#F7931A" }}
                handleStyle={{
                  borderColor: "#F7931A",
                  backgroundColor: "#F7931A"
                }}
                railStyle={{ backgroundColor: "#2D333B" }}
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>1%</span>
                <span>
                  {MAX_LTV}%
                </span>
              </div>
            </div>

            {/* Stablecoin Selection */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                Select Stablecoin
              </label>
              <div className="flex gap-4">
                {["USDC", "USDT"].map(coin =>
                  <motion.button
                    key={coin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStablecoin(coin)}
                    className={`flex-1 py-3 rounded-lg transition-colors ${selectedStablecoin ===
                    coin
                      ? "bg-[#F7931A] text-white"
                      : "bg-[#2D333B] text-gray-300"}`}
                  >
                    {coin}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Loan Details */}
            <div className="bg-[#2D333B] p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400">Loan Amount</p>
                  <p className="text-xl font-bold text-white">
                    {calculateLoanAmount().toLocaleString()}{" "}
                    {selectedStablecoin}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Interest Rate</p>
                  <p className="text-xl font-bold text-white">
                    {calculateInterestRate()}% APR
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Repayment Deadline</p>
                  <p className="text-xl font-bold text-white">
                    {new Date(
                      Date.now() + 30 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Borrow Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!collateralAmount || collateralAmount <= 0}
              className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
                ${!collateralAmount || collateralAmount <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#F7931A]/90"}`}
            >
              Borrow {selectedStablecoin}
            </motion.button>
          </motion.div>
        </div>
        {/* Active Loans Table */}
        <div className="w-full max-w-7xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg overflow-x-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Active Loans</h2>
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="pb-4">Loan ID</th>
                  <th className="pb-4">BTC Collateral</th>
                  <th className="pb-4">Borrowed Amount</th>
                  <th className="pb-4">Interest Accrued</th>
                  <th className="pb-4">Due Date</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loanPositions.map(loan =>
                  <tr key={loan.id} className="border-t border-[#2D333B]">
                    <td className="py-4 text-white">
                      {loan.id}
                    </td>
                    <td className="py-4 text-white">
                      {loan.collateral} BTC
                    </td>
                    <td className="py-4 text-white">
                      {loan.borrowed.toLocaleString()} {loan.currency}
                    </td>
                    <td className="py-4 text-white">
                      {loan.interest}% ({(loan.borrowed *
                        loan.interest /
                        100).toLocaleString()}{" "}
                      {loan.currency})
                    </td>
                    <td className="py-4 text-white">
                      {loan.dueDate}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${loan.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"}`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowRepayModal(true);
                        }}
                        className="bg-[#2F80ED] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2F80ED]/90 transition-colors"
                      >
                        Repay
                      </motion.button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>

      {/* Repayment Modal */}
      <AnimatePresence>
        {showRepayModal &&
          <RepaymentModal
            loan={selectedLoan}
            onClose={() => setShowRepayModal(false)}
          />}
      </AnimatePresence>
    </div>
  );
};

export default StablecoinLoan;
