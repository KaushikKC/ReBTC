"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCopy,
  FaBitcoin,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import RepaymentModal from "../components/RepaymentModal";
import TimeLoader from "../components/TimeLoader";

const Profile = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true); // Start with true to show loading
  const [showContent, setShowContent] = useState(false);

  // Effect to handle initial loading
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsProcessing(false);
      setShowContent(true);
    }, 2000); 

    return () => clearTimeout(loadingTimer);
  }, []);

  const walletAddress = "0xA12...B34";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRepayClick = loan => {
    if (!loan) return;

    const preparedLoan = {
      ...loan,
      borrowed: loan.amount,
      interest: loan.rate
    };

    setSelectedLoan(preparedLoan);
    setShowRepayModal(true);
  };

  // Example data
  const userStats = {
    totalDeposited: 1.25,
    totalEarnings: 0.15,
    activeLoans: 5000,
    insuranceStatus: true
  };

  const deposits = [
    { asset: "BTC", amount: 1.0, apy: 4.5, status: "Active" },
    { asset: "lstBTC", amount: 0.25, apy: 7.2, status: "Active" }
  ];

  const yieldBreakdown = [
    { type: "Staking Yield", amount: 0.05 },
    { type: "Lending Yield", amount: 0.04 },
    { type: "Restaking Rewards", amount: 0.03 },
    { type: "Borrowing Optimization", amount: 0.03 }
  ];

  const activeLoans = [
    {
      id: "#001",
      amount: 5000,
      borrowed: 5000,
      currency: "USDT",
      rate: 3.5,
      interest: 3.5,
      dueDate: "12-Apr",
      status: "Active",
      collateral: 0.15
    },
    {
      id: "#002",
      amount: 2500,
      borrowed: 2500,
      currency: "USDC",
      rate: 4.2,
      interest: 4.2,
      dueDate: "18-Apr",
      status: "Pending",
      collateral: 0.08
    }
  ];

  const transactions = [
    {
      hash: "0x1234",
      lstBtcUsed: 10,
      stablecoins: 15000,
      currency: "USDT",
      status: "Paid"
    },
    {
      hash: "0x5678",
      lstBtcUsed: 5,
      stablecoins: 7500,
      currency: "USDC",
      status: "Pending"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-['Quantify']">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <AnimatePresence>
          {isProcessing &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#1C2128]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50"
            >
              <TimeLoader />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-medium"
              >
                Fetching profile
              </motion.p>
            </motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {showContent && (
            <>
                {/* User Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <h1 className="text-2xl font-bold mr-4 tracking-[1px]">
                Profile
              </h1>
              <div className="flex items-center bg-[#2D333B] rounded-lg px-3 py-2">
                <span className="text-gray-300 mr-2">
                  {walletAddress}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={copyToClipboard}
                  className="text-[#F7931A] hover:text-[#F7931A]/80"
                >
                  {copySuccess ? <FaCheckCircle /> : <FaCopy />}
                </motion.button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {isProcessing &&
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#1C2128]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
              >
                <TimeLoader />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white font-medium"
                >
                  Fetching profile
                </motion.p>
              </motion.div>}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total BTC Deposited"
              value={`${userStats.totalDeposited} BTC`}
              icon={FaBitcoin}
            />
            <StatsCard
              title="Total Earnings"
              value={`${userStats.totalEarnings} BTC`}
              icon={FaBitcoin}
            />
            <StatsCard
              title="Active Loans"
              value={`$${userStats.activeLoans} USDT`}
              icon={FaExchangeAlt}
            />
            <StatsCard
              title="Insurance Coverage"
              value={userStats.insuranceStatus ? "Active" : "Inactive"}
              icon={FaCheckCircle}
              status={userStats.insuranceStatus}
            />
          </div>
        </motion.div>

        {/* Deposits & Earnings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1C2128] rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold mb-6">Deposited Assets</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left pb-4">Asset</th>
                    <th className="text-left pb-4">Amount</th>
                    <th className="text-left pb-4">APY</th>
                    <th className="text-left pb-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit, index) =>
                    <tr key={index} className="border-t border-[#2D333B]">
                      <td className="py-4">
                        {deposit.asset}
                      </td>
                      <td className="py-4">
                        {deposit.amount}
                      </td>
                      <td className="py-4 text-[#F7931A]">
                        {deposit.apy}%
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {deposit.status}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1C2128] rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold mb-6">Yield Breakdown</h2>
            <div className="space-y-4">
              {yieldBreakdown.map((item, index) =>
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {item.type}
                  </span>
                  <span className="text-[#F7931A] font-bold">
                    {item.amount} BTC
                  </span>
                </div>
              )}
              <div className="pt-4 border-t border-[#2D333B]">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-[#F7931A] font-bold">
                    {yieldBreakdown.reduce(
                      (acc, curr) => acc + curr.amount,
                      0
                    )}{" "}
                    BTC
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Loans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-6">Active Loans</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left pb-4">Loan ID</th>
                  <th className="text-left pb-4">Amount</th>
                  <th className="text-left pb-4">Interest Rate</th>
                  <th className="text-left pb-4">Due Date</th>
                  <th className="text-left pb-4">Status</th>
                  <th className="text-left pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((loan, index) =>
                  <tr key={index} className="border-t border-[#2D333B]">
                    <td className="py-4">
                      {loan.id}
                    </td>
                    <td className="py-4">
                      {loan.amount} {loan.currency}
                    </td>
                    <td className="py-4">
                      {loan.rate}%
                    </td>
                    <td className="py-4">
                      {loan.dueDate}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status ===
                        "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRepayClick(loan)}
                        className="bg-[#2F80ED] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2F80ED]/90"
                      >
                        Repay
                      </motion.button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Transaction History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1C2128] rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-6">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left pb-4">Transaction Hash</th>
                  <th className="text-left pb-4">lstBTC Used</th>
                  <th className="text-left pb-4">Stablecoins</th>
                  <th className="text-left pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) =>
                  <tr key={index} className="border-t border-[#2D333B]">
                    <td className="py-4">
                      {tx.hash}
                    </td>
                    <td className="py-4">
                      {tx.lstBtcUsed} lstBTC
                    </td>
                    <td className="py-4">
                      {tx.stablecoins} {tx.currency}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status ===
                        "Paid"
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
          </div>
        </motion.div>
            </>
          )}
        </AnimatePresence>
   
      </div>

      <AnimatePresence>
          {showRepayModal && selectedLoan && (
            <RepaymentModal
              loan={{
                ...selectedLoan,
                borrowed: selectedLoan.amount,
                interest: selectedLoan.rate
              }}
              onClose={() => {
                setShowRepayModal(false);
                setSelectedLoan(null);
              }}
            />
          )}
        </AnimatePresence>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, status }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#2D333B] p-6 rounded-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-[#1C2128] rounded-lg">
          <Icon className="text-[#F7931A] text-xl" />
        </div>
        <h3 className="text-gray-400">
          {title}
        </h3>
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
        {status !== undefined &&
          <span
            className={`ml-2 text-sm ${status
              ? "text-green-500"
              : "text-red-500"}`}
          >
            ●
          </span>}
      </p>
    </motion.div>
  );
};

export default Profile;
