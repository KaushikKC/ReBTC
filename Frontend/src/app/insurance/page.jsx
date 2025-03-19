"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InsuranceModal from "../components/InsuranceModal";
import InsuranceStatsCard from "../components/InsuranceStatsCard";
import { FaShieldAlt, FaCoins, FaHistory, FaFileAlt } from "react-icons/fa";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";
import TimeLoader from "../components/TimeLoader";
import ClaimModal from "../components/ClaimModal";

export default function Insurance() {
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const stats = [
    {
      title: "Total Insurance Pool",
      value: "245.8721 BTC",
      icon: FaShieldAlt,
    },
    {
      title: "Total Claims Paid",
      value: "12.4532 BTC",
      icon: FaCoins,
    },
    {
      title: "Active Policies",
      value: "1,234",
      icon: FaHistory,
    },
  ];

  // Sample active insurance policies
  const activeInsurances = [
    {
      id: "INS-001",
      type: "Liquidation Protection",
      coverageAmount: "2.5000",
      premium: "0.0250",
      startDate: "2024-01-01",
      endDate: "2024-04-01",
      status: "Active",
    },
    {
      id: "INS-002",
      type: "Smart Contract Risk",
      coverageAmount: "1.7500",
      premium: "0.0350",
      startDate: "2024-01-15",
      endDate: "2024-07-15",
      status: "Active",
    },
    {
      id: "INS-003",
      type: "Slashing Protection",
      coverageAmount: "3.2000",
      premium: "0.0320",
      startDate: "2023-12-10",
      endDate: "2024-03-10",
      status: "Active",
    },
  ];

  const claims = [
    {
      date: "2024-01-15",
      type: "Liquidation Protection",
      amount: "0.5432",
      status: "Approved",
    },
    {
      date: "2024-01-14",
      type: "Smart Contract Risk",
      amount: "0.2123",
      status: "Pending",
    },
    {
      date: "2024-01-13",
      type: "Slashing Protection",
      amount: "0.3214",
      status: "Rejected",
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClaimClick = (policy) => {
    setSelectedPolicy(policy);
    setShowClaimModal(true);
  };

  if (isInitialLoading) {
    return (
      <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <TimeLoader />
          <p className="text-white mt-4 font-['Quantify']">
            Loading Insurance Data
          </p>
        </div>
      </div>
    );
  }

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
                Protect your assets with our comprehensive insurance coverage
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
            {stats.map((stat, index) => (
              <InsuranceStatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Active Insurances Section */}
          <div className="bg-[#1C2128] rounded-xl p-6 overflow-x-auto mb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Your Active Insurance Policies
            </h3>

            {activeInsurances.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                You don't have any active insurance policies
              </div>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="pb-4">Policy ID</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Coverage</th>
                    <th className="pb-4">Premium</th>
                    <th className="pb-4">Expiry</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInsurances.map((policy, index) => (
                    <motion.tr
                      key={policy.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-t border-[#2D333B] text-white"
                    >
                      <td className="py-4">{policy.id}</td>
                      <td className="py-4">{policy.type}</td>
                      <td className="py-4">{policy.coverageAmount} BTC</td>
                      <td className="py-4">{policy.premium} BTC</td>
                      <td className="py-4">{policy.endDate}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-500">
                          {policy.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClaimClick(policy)}
                          className="bg-[#2F80ED] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2F80ED]/90 transition-colors"
                        >
                          Claim
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
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
                {claims.map((claim, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-white"
                  >
                    <td className="py-3">{claim.date}</td>
                    <td className="py-3">{claim.type}</td>
                    <td className="py-3">{claim.amount} BTC</td>
                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          claim.status === "Approved"
                            ? "bg-green-500/20 text-green-500"
                            : claim.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insurance Modal */}
          <AnimatePresence>
            {showInsuranceModal && (
              <InsuranceModal onClose={() => setShowInsuranceModal(false)} />
            )}
          </AnimatePresence>

          {/* Claim Modal */}
          <AnimatePresence>
            {showClaimModal && selectedPolicy && (
              <ClaimModal
                policy={selectedPolicy}
                onClose={() => setShowClaimModal(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
