"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import TimeLoader from "../components/TimeLoader";
import {
  FaServer,
  FaCode,
  FaGlobe,
  FaBitcoin,
  FaChartLine,
  FaShieldAlt,
  FaExchangeAlt,
} from "react-icons/fa";
import Footer from "../components/Footer";
export default function About() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    const handleScroll = () => {
      const scrolled = window.scrollY;
      if (scrolled > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const features = [
    {
      icon: FaBitcoin,
      title: "BTC Yield Vault",
      description:
        "Deposit BTC, wBTC, or LSTs to earn yield with auto-compounding rewards.",
      color: "#F7931A",
      delay: 0.2,
    },
    {
      icon: FaChartLine,
      title: "BTC Collateralized Lending",
      description:
        "Borrow USDT/USDC using lstBTC as collateral with automated LTV monitoring.",
      color: "#2F80ED",
      delay: 0.4,
    },
    {
      icon: FaExchangeAlt,
      title: "Instant Liquidity & Flash Loans",
      description:
        "Instant swaps between lstBTC and BTC with flash loan capabilities.",
      color: "#9945FF",
      delay: 0.6,
    },
    {
      icon: FaShieldAlt,
      title: "BTC Insurance Pool",
      description:
        "Opt-in insurance coverage for staking and borrowing with automated claims.",
      color: "#00C853",
      delay: 0.8,
    },
  ];

  const techStack = [
    {
      icon: FaCode,
      title: "Smart Contracts",
      items: [
        "Solidity (EVM-based chains)",
        "Chainlink Oracles",
        "LayerZero / CCIP / Axelar",
      ],
      gradient: "from-[#F7931A] to-[#2F80ED]",
    },
    {
      icon: FaServer,
      title: "Backend",
      items: [
        "Node.js / Express.js",
        "MongoDB / PostgreSQL",
        "Web3.js / Ethers.js",
      ],
      gradient: "from-[#2F80ED] to-[#9945FF]",
    },
    {
      icon: FaGlobe,
      title: "Frontend",
      items: ["Next.js", "TailwindCSS", "RainbowKit"],
      gradient: "from-[#9945FF] to-[#00C853]",
    },
  ];

  if (isInitialLoading) {
    return (
      <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <TimeLoader />
          <p className="text-white mt-4 font-['Quantify']">
            Know more about ReBTC
          </p>
        </div>
      </div>
    );
  }

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
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen overflow-hidden">
      <Navbar />

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#F7931A]/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute top-[50%] right-[10%] w-64 h-64 bg-[#2F80ED]/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
          <div className="absolute bottom-[20%] left-[30%] w-64 h-64 bg-[#9945FF]/20 rounded-full filter blur-[100px] animate-pulse delay-2000" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-30">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7931A]/10 via-transparent to-[#2F80ED]/10 blur-xl" />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 relative">
            ReBTC
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-[#2F80ED]">
              : The Future of BTC
            </span>
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg relative">
            An advanced Bitcoin-based DeFi protocol enabling yield generation,
            borrowing, insurance, and cross-chain collateralization.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-[#1C2128] rounded-xl p-8 hover:bg-[#2D333B] transition-all duration-300 cursor-pointer overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay }}
              onHoverStart={() => setActiveFeature(index)}
              onHoverEnd={() => setActiveFeature(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 z-0" />
              <div className="absolute -right-20 -bottom-20 text-[120px] opacity-10">
                <feature.icon className="transform rotate-12" />
              </div>
              <div className="relative z-10">
                <feature.icon
                  className="text-3xl mb-4"
                  style={{ color: feature.color }}
                />
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r"
                style={{ background: feature.color }}
                initial={{ width: "0%" }}
                animate={{ width: activeFeature === index ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Tech Stack Section */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <h2 className="text-4xl font-bold text-white text-center mb-12 relative">
            <span className="relative">
              Tech Stack
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#F7931A] to-[#2F80ED]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.2, duration: 0.8 }}
              />
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {techStack.map((stack, index) => (
              <motion.div
                key={index}
                className={`relative bg-[#1C2128] rounded-xl p-8 overflow-hidden`}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stack.gradient} opacity-5`}
                />
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <stack.icon
                      className={`text-3xl mr-3 bg-gradient-to-r ${stack.gradient} text-transparent bg-clip-text`}
                    />
                    <h3 className="text-2xl font-bold text-white">
                      {stack.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {stack.items.map((item, idx) => (
                      <motion.li
                        key={idx}
                        className="text-gray-400 flex items-center space-x-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 + idx * 0.1 }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#F7931A] to-[#2F80ED]" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Future Implementations */}
        <motion.div
          className="relative bg-[#1C2128] rounded-xl p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7931A]/5 to-[#2F80ED]/5" />
          <h2 className="text-4xl font-bold text-white mb-10 text-center relative">
            Future Implementations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6 relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F7931A] to-[#2F80ED]" />
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-[#2F80ED]">
                Cross-Chain Collateralization
              </h3>
              <ul className="text-gray-400 space-y-4">
                <motion.li
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#F7931A]" />
                  <span>
                    Use BTC on Ethereum to borrow stablecoins on multiple chains
                  </span>
                </motion.li>
                <motion.li
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#2F80ED]" />
                  <span>Powered by LayerZero, Chainlink CCIP, or Axelar</span>
                </motion.li>
              </ul>
            </div>
            <div className="space-y-6 relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#2F80ED] to-[#9945FF]" />
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2F80ED] to-[#9945FF]">
                Institutional Vaults
              </h3>
              <ul className="text-gray-400 space-y-4">
                <motion.li
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6 }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#2F80ED]" />
                  <span>High-yield vaults for DAOs and large BTC holders</span>
                </motion.li>
                <motion.li
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.7 }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#9945FF]" />
                  <span>Automated rebalancing for optimal performance</span>
                </motion.li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-[#F7931A] to-[#2F80ED] p-3 rounded-full shadow-lg cursor-pointer z-50"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>
    </div>
  );
}
