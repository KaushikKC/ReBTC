"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";

function Dashboard() {
  return (
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
      <Navbar />

      {/* Main content section with flex-grow to push stats to bottom */}
      <div className="flex-grow flex items-center justify-center px-4 pt-16">
        <div className="flex flex-col justify-center items-center space-y-5 max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className=""
          >
            Align your Chakras
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center text-[44px] font-bold text-[#2F80ED] tracking-wide relative"
          >
            Core & BTC's Yield & Liquidity Hub
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-xl text-center text-gray-300"
          >
            Multi-Layer BTC Yield Vault with Instant Liquidity, BTC Insurance
            Pool & Multi-Yield Stacking Support
          </motion.p>
        </div>
      </div>
      <div className="flex justify-center pb-26 gap-8">
        <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
        <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
        <SqueezeButton text={"Instant Liquidity"} to="/flash-loan" />
        <SqueezeButton text={"BTC Insurance Pool "} to="/insurance" />
      </div>
      <div className="flex justify-around pb-26 px-4 bg-[#0D1117]/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-2">Total BTC Deposited</p>
          <p className="text-[44px] font-bold text-white tracking-wide">
            $5.1M
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-2">Total Yield Earned</p>
          <p className="text-[44px] font-bold text-white tracking-wide">
            $5.1M
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-2">Insurance Coverage Status</p>
          <p className="text-[44px] font-bold text-white tracking-wide">
            $5.1M
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
