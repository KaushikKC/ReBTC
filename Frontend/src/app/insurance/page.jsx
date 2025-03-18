"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InsuranceModal from "../components/InsuranceModal";
import InsuranceStatsCard from "../components/InsuranceStatsCard";
import { FaShieldAlt, FaCoins, FaHistory } from "react-icons/fa";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";

export default function Insurance() {
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  const stats = [
    {
      title: "Total Insurance Pool",
      value: "245.8721 BTC",
      icon: FaShieldAlt
    },
    {
      title: "Total Claims Paid",
      value: "12.4532 BTC",
      icon: FaCoins
    },
    {
      title: "Active Policies",
      value: "1,234",
      icon: FaHistory
    }
  ];

  const claims = [
    {
      date: "2024-01-15",
      type: "Liquidation Protection",
      amount: "0.5432",
      status: "Approved"
    },
    {
      date: "2024-01-14",
      type: "Smart Contract Risk",
      amount: "0.2123",
      status: "Pending"
    },
    {
      date: "2024-01-13",
      type: "Slashing Protection",
      amount: "0.3214",
      status: "Rejected"
    }
  ];

  return (
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center px-4 pt-32">
        <div className="flex flex-wrap justify-center pb-16 gap-4 md:gap-8 w-full max-w-7xl">
          <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
          <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
          <SqueezeButton text={"Instant Liquidity"} to="/flash-loan" />
          <SqueezeButton text={"BTC Insurance Pool"} to="/insurance" />
        </div>
        <div className="w-full max-w-4xl px-4 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                BTC Insurance Pool
              </h1>
              <p className="text-gray-400 max-w-xl">
                2024-01-13 Slashing Protection Protect your assets with our
                comprehensive insurance coverage
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInsuranceModal(true)}
              className="bg-[#F7931A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#F7931A]/90 transition-colors"
            >
              Get Insurance
            </motion.button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) =>
              <InsuranceStatsCard key={index} {...stat} />
            )}
          </div>

          {/* Claims History */}
          <div className="bg-[#1C2128] rounded-xl p-6 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-4">Claim History</h3>
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, index) =>
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-white"
                  >
                    <td className="py-3">
                      {claim.date}
                    </td>
                    <td className="py-3">
                      {claim.type}
                    </td>
                    <td className="py-3">
                      {claim.amount} BTC
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${claim.status ===
                        "Approved"
                          ? "bg-green-500/20 text-green-500"
                          : claim.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-red-500/20 text-red-500"}`}
                      >
                        {claim.status}
                      </span>
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Insurance Modal */}
          <AnimatePresence>
            {showInsuranceModal &&
              <InsuranceModal onClose={() => setShowInsuranceModal(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
