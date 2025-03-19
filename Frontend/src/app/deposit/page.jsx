"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import Navbar from "../components/Navbar";
import yieldbox from "../assets/yieldbox.svg";
import SqueezeButton from "../components/SqueezeButton";
import Image from "next/image";
import UserDepositsOverview from "../components/UserDepositsOverview";
import TimeLoader from "../components/TimeLoader";

const cryptoOptions = [
  { id: "btc", name: "BTC", balance: "0.5" },
  { id: "wbtc", name: "wBTC", balance: "0.3" },
  { id: "lstbtc", name: "lstBTC", balance: "0.2" }
];

function Deposit() {
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [apy, setApy] = useState(12.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const handleMaxClick = () => {
    setAmount(selectedCrypto.balance);
  };

  const calculateProjectedApy = amount => {
    return amount ? (parseFloat(amount) * apy).toFixed(2) : "0.00";
  };

  const handleDeposit = async () => {
    try {
      setIsProcessing(true);
      setProcessingStep("Processing Deposit");

      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStep("Confirming Transaction");

      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep("Deposit Successful!");
      setIsSuccess(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Deposit successful");
    } catch (error) {
      console.error("Deposit failed:", error);
      setProcessingStep("Deposit Failed");
    } finally {
      setIsProcessing(false);
      setIsSuccess(false);
      setProcessingStep("");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);



  if (isInitialLoading) {
    return (
      <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <TimeLoader />
          <p className="text-white mt-4 font-['Quantify']">Loading Vault Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] flex flex-col">
      <Navbar />

      <div className="flex-grow flex justify-center px-4 pt-32">
        <div className="flex justify-center pb-10 gap-8">
          <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
          <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
          <SqueezeButton text={"Instant Liquidity "} to="/flash-loan" />
          <SqueezeButton text={"BTC Insurance Pool "} to="/insurance" />
        </div>
      </div>

      <div className=" px-4 md:px-8 space-y-8 pb-5">
        {/* User Deposits Overview */}

        <UserDepositsOverview />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto bg-[#1C2128] rounded-xl p-6 shadow-lg relative"
      >
        {/* Asset Selection Section */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Select Asset
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-[#2D333B] p-4 rounded-lg hover:bg-[#373E47] transition-colors"
            >
              <span className="text-white">
                {selectedCrypto.name}
              </span>
              <FaChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen &&
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute w-full mt-2 bg-[#2D333B] rounded-lg shadow-xl z-10"
              >
                {cryptoOptions.map(option =>
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedCrypto(option);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#373E47] text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option.name}
                  </button>
                )}
              </motion.div>}
          </div>

          {/* Balance Display */}
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-400">Available Balance:</span>
            <span className="text-white">
              {selectedCrypto.balance} {selectedCrypto.name}
            </span>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Enter Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
              placeholder="0.00"
            />
            <button
              onClick={handleMaxClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-3 py-1 rounded-md text-sm hover:bg-[#2F80ED]/80 transition-colors"
            >
              MAX
            </button>
          </div>
        </div>

        {/* APY Section */}
        <motion.div
          animate={{ opacity: amount ? 1 : 0.5 }}
          className="bg-[#2D333B] p-4 rounded-lg mb-6"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Projected APY</span>
            <span className="text-[#2F80ED] font-bold">
              {apy}%
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-300">Projected Earnings</span>
            <span className="text-white">
              {calculateProjectedApy(amount)} {selectedCrypto.name}/year
            </span>
          </div>
        </motion.div>

        {/* Minimum Deposit Notice */}
        {parseFloat(amount) < 0.01 &&
          amount !== "" &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4"
          >
            Minimum deposit required: 0.01 {selectedCrypto.name}
          </motion.div>}

        {/* Deposit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDeposit}
          disabled={isProcessing || !amount || parseFloat(amount) < 0.01}
          className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-all
            ${isProcessing || !amount || parseFloat(amount) < 0.01
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[#F7931A]/90"}`}
        >
          {isProcessing ? "Processing..." : `Deposit ${selectedCrypto.name}`}
        </motion.button>
        <AnimatePresence>
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1C2128]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
        >
          {!isSuccess ? (
            <>
              <TimeLoader />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-medium"
              >
                {processingStep}
              </motion.p>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-[#4CAF50] text-5xl">✓</div>
              <p className="text-white font-medium">{processingStep}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.0 }}
        transition={{ duration: 0.6 }}
        className="text-center text-[35px] font-bold text-white tracking-wide relative pt-16"
      >
        <span className="relative inline-block">
          Live Yield Simulation Box
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/20 via-[#F7931A]/20 to-[#2F80ED]/20 blur-xl -z-10"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </span>
      </motion.h2>
      <div className="flex justify-center">
        <Image
          src={yieldbox}
          alt="yield"
          className="w-full max-w-[1200px] px-6 "
          priority
        />
      </div>
    </div>
  );
}

export default Deposit;
