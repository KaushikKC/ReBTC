"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";
import { FaBitcoin, FaBolt, FaChartLine, FaShieldAlt } from "react-icons/fa";
import { PiVaultFill } from "react-icons/pi";
import Footer from "../components/Footer";
function Dashboard() {
  const features = [
    {
      title: "Deposit & Yield Vault",
      description:
        "Stake your BTC and earn passive yield through multi-layer stacking strategies",
      icon: PiVaultFill,
      to: "/deposit",
      color: "from-blue-500/20 to-transparent",
    },
    {
      title: "Borrow Against BTC",
      description:
        "Get instant stablecoin loans using your BTC as collateral with flexible LTV options",
      icon: FaBitcoin,
      to: "/stablecoin-loan",
      color: "from-[#F7931A]/20 to-transparent",
    },
    {
      title: "Instant Liquidity",
      description:
        "Access flash loans for immediate liquidity needs without long-term commitment",
      icon: FaBolt,
      to: "/flash-loan",
      color: "from-yellow-500/20 to-transparent",
    },
    {
      title: "BTC Insurance Pool",
      description:
        "Protect your assets with our comprehensive liquidation and slashing coverage",
      icon: FaShieldAlt,
      to: "/insurance",
      color: "from-green-500/20 to-transparent",
    },
  ];
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
      <Navbar />

      {/* Main content section */}
      <div className="relative flex-grow flex items-center justify-center px-4 pt-16 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2F80ED]/10 rounded-full filter blur-[80px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F7931A]/10 rounded-full filter blur-[80px] animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="relative w-full h-full">
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "radial-gradient(circle at 50% 50%, rgba(47, 128, 237, 0.05) 0%, transparent 50%)",
                    "radial-gradient(circle at 50% 50%, rgba(247, 147, 26, 0.05) 0%, transparent 50%)",
                  ],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col justify-center items-center space-y-8 max-w-4xl">
          {/* First line with glowing effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative group"
          >
            <motion.p
              className="text-xl text-white font-medium tracking-wider"
              whileHover={{ scale: 1.05 }}
            >
              Align your Chakras
            </motion.p>
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-[#2F80ED]/20 to-[#F7931A]/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </motion.div>

          {/* Main title with dynamic gradient and floating effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <motion.p
              className="text-center text-5xl font-bold tracking-wide relative z-10"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2F80ED] via-[#F7931A] to-[#2F80ED] bg-size-200 animate-gradient">
                Core & BTC's Yield &
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F7931A] via-[#2F80ED] to-[#F7931A] bg-size-200 animate-gradient-reverse">
                Liquidity Hub
              </span>
            </motion.p>
            {/* Decorative elements */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#2F80ED]/10 to-[#F7931A]/10 rounded-xl blur-xl z-0" />
          </motion.div>

          {/* Description with animated underline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative group"
          >
            <p className="max-w-xl text-center text-gray-300 text-lg leading-relaxed">
              Multi-Layer BTC Yield Vault with Instant Liquidity, BTC Insurance
              Pool & Multi-Yield Stacking Support
            </p>
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2F80ED] to-[#F7931A]"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>

          {/* Floating icons */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-10 left-10"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <FaBitcoin className="text-[#F7931A] text-4xl opacity-20" />
            </motion.div>
            <motion.div
              className="absolute bottom-10 right-10"
              animate={{
                y: [0, 20, 0],
                rotate: [0, -360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <FaChartLine className="text-[#2F80ED] text-4xl opacity-20" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 py-12 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className={`relative w-full`}>
              <div
                className={`absolute inset-0 bg-gradient-to-b ${feature.color} rounded-xl filter blur-xl`}
              />
              <div className="relative bg-[#1C2128] rounded-xl p-6 backdrop-blur-sm border border-gray-800">
                <div className="flex flex-col items-center text-center space-y-4">
                  <feature.icon className="text-[#F7931A] text-3xl mb-2" />
                  <SqueezeButton text={feature.title} to={feature.to} />
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="flex flex-col md:flex-row justify-around gap-6 p-8 bg-[#0D1117]/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-2">Total BTC Deposited</p>
          <p className="text-[44px] font-bold text-white tracking-wide">
            $5000
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
      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>

      {/* Page-wide Gradient Effects */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2F80ED]/10 rounded-full filter blur-[100px] transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F7931A]/10 rounded-full filter blur-[100px] transform translate-x-1/2 translate-y-1/2" />
      </motion.div>
    </div>
  );
}

export default Dashboard;
