"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBitcoin, FaChartLine, FaClock } from "react-icons/fa";
import WithdrawModal from "./WithdrawModal";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useDataContext } from "@/context/DataContext";

// Import contract addresses and ABIs
import {
  DEPOSIT_CONTRACT_ADDRESS,
  DEPOSIT_CONTRACT_ABI,
} from "../../constants/contracts";

const UserDepositsOverview = () => {
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositStats, setDepositStats] = useState({
    totalDeposited: 0,
    earnings: 0,
    nextPayout: "2024-02-20",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasDeposits, setHasDeposits] = useState(false);

  const { address, isConnected } = useAccount();
  const { getContractInstance } = useDataContext();

  // Fetch user deposit data when component mounts or address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchUserDepositData();
    } else {
      setIsLoading(false);
      setHasDeposits(false);
    }
  }, [address, isConnected]);

  const fetchUserDepositData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const depositContract = await getContractInstance(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI
      );

      if (!depositContract) {
        throw new Error("Failed to initialize contract");
      }

      // First check if user has any deposits to avoid errors
      try {
        // Try to get BTC deposits
        const btcDeposits = await depositContract.userBtcDeposits(address);

        if (btcDeposits && btcDeposits.amount && btcDeposits.amount.gt(0)) {
          // User has BTC deposits
          setHasDeposits(true);

          // Format BTC deposit amount (8 decimals)
          const formattedBtcDeposit = ethers.utils.formatUnits(
            btcDeposits.amount,
            8
          );

          // Try to get earnings
          let earnings = 0;
          try {
            const userEarnings = await depositContract.calculateEarnings(
              address
            );
            earnings = parseFloat(ethers.utils.formatUnits(userEarnings, 8));
          } catch (earningsError) {
            console.warn("Could not fetch earnings:", earningsError);
            // Continue without earnings data
          }

          // Update state with fetched data
          setDepositStats({
            totalDeposited: parseFloat(formattedBtcDeposit),
            earnings: earnings,
            nextPayout: "2024-02-20", // This could be fetched from contract if available
          });
        } else {
          // Try to get WETH deposits as fallback
          try {
            const wethDeposits = await depositContract.userWethDeposits(
              address
            );

            if (
              wethDeposits &&
              wethDeposits.amount &&
              wethDeposits.amount.gt(0)
            ) {
              // User has WETH deposits
              setHasDeposits(true);

              // Format WETH deposit amount (18 decimals)
              const formattedWethDeposit = ethers.utils.formatUnits(
                wethDeposits.amount,
                18
              );

              // Try to get earnings
              let earnings = 0;
              try {
                const userEarnings = await depositContract.calculateEarnings(
                  address
                );
                earnings = parseFloat(
                  ethers.utils.formatUnits(userEarnings, 18)
                );
              } catch (earningsError) {
                console.warn("Could not fetch earnings:", earningsError);
                // Continue without earnings data
              }

              // Update state with fetched data
              setDepositStats({
                totalDeposited: parseFloat(formattedWethDeposit),
                earnings: earnings,
                nextPayout: "2024-02-20",
              });
            } else {
              // No deposits found
              setHasDeposits(false);
              setDepositStats({
                totalDeposited: 0,
                earnings: 0,
                nextPayout: "2024-02-20",
              });
            }
          } catch (wethError) {
            console.warn("Could not fetch WETH deposits:", wethError);
            setHasDeposits(false);
          }
        }
      } catch (btcError) {
        console.warn("Could not fetch BTC deposits:", btcError);

        // Try WETH deposits as fallback
        try {
          const wethDeposits = await depositContract.userWethDeposits(address);

          if (
            wethDeposits &&
            wethDeposits.amount &&
            wethDeposits.amount.gt(0)
          ) {
            // User has WETH deposits
            setHasDeposits(true);

            // Format WETH deposit amount (18 decimals)
            const formattedWethDeposit = ethers.utils.formatUnits(
              wethDeposits.amount,
              18
            );

            // Update state with fetched data
            setDepositStats({
              totalDeposited: parseFloat(formattedWethDeposit),
              earnings: 0, // Default to 0 if we can't get earnings
              nextPayout: "2024-02-20",
            });
          } else {
            // No deposits found
            setHasDeposits(false);
          }
        } catch (wethError) {
          console.warn("Could not fetch WETH deposits either:", wethError);
          setHasDeposits(false);
        }
      }
    } catch (error) {
      console.error("Error fetching user deposit data:", error);
      setError("Failed to fetch deposit data. Please try again later.");
      setHasDeposits(false);

      // Set default values to prevent UI from breaking
      setDepositStats({
        totalDeposited: 0,
        earnings: 0,
        nextPayout: "2024-02-20",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReinvest = async () => {
    try {
      if (!address || !hasDeposits) {
        return;
      }

      setIsLoading(true);
      const depositContract = await getContractInstance(
        DEPOSIT_CONTRACT_ADDRESS,
        DEPOSIT_CONTRACT_ABI
      );

      if (depositContract) {
        // Call reinvest function on the contract
        const tx = await depositContract.reinvestEarnings();
        await tx.wait();

        // Refresh data after successful reinvestment
        fetchUserDepositData();
      }
    } catch (error) {
      console.error("Error reinvesting earnings:", error);
      setError("Failed to reinvest earnings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not connected, show a message
  if (!isConnected && !isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg text-center"
        >
          <p className="text-gray-300 mb-4">
            Connect your wallet to view your deposits
          </p>
        </motion.div>
      </div>
    );
  }

  // If user has no deposits, show a message
  if (!hasDeposits && !isLoading && isConnected) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg text-center"
        >
          <p className="text-gray-300 mb-4">You don't have any deposits yet</p>
          <p className="text-[#F7931A]">
            Make your first deposit to start earning yield!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        {/* Total Deposited Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center mb-2">
            <FaBitcoin className="text-[#F7931A] text-xl mr-2" />
            <h3 className="text-gray-300">Total Deposited</h3>
          </div>
          {isLoading ? (
            <p className="text-2xl font-bold text-white">Loading...</p>
          ) : (
            <p className="text-2xl font-bold text-white">
              {depositStats.totalDeposited.toFixed(6)} BTC
            </p>
          )}
        </motion.div>

        {/* Earnings Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center mb-2">
            <FaChartLine className="text-[#2F80ED] text-xl mr-2" />
            <h3 className="text-gray-300">Accumulated Earnings</h3>
          </div>
          {isLoading ? (
            <p className="text-2xl font-bold text-white">Loading...</p>
          ) : (
            <p className="text-2xl font-bold text-white">
              {depositStats.earnings.toFixed(6)} BTC
            </p>
          )}
        </motion.div>

        {/* Next Payout Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[#1C2128] p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center mb-2">
            <FaClock className="text-[#F7931A] text-xl mr-2" />
            <h3 className="text-gray-300">Next Payout</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {new Date(depositStats.nextPayout).toLocaleDateString()}
          </p>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setWithdrawModalOpen(true)}
          className={`flex-1 bg-[#F7931A] text-white py-4 px-6 rounded-lg font-medium transition-colors
            ${
              isLoading || depositStats.totalDeposited <= 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#F7931A]/90"
            }`}
          disabled={isLoading || depositStats.totalDeposited <= 0}
        >
          Withdraw Funds
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReinvest}
          disabled={isLoading || depositStats.earnings <= 0}
          className={`flex-1 bg-[#2F80ED] text-white py-4 px-6 rounded-lg font-medium transition-colors
            ${
              isLoading || depositStats.earnings <= 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#2F80ED]/90"
            }`}
        >
          Reinvest Earnings
        </motion.button>
      </motion.div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <WithdrawModal
            onClose={() => setWithdrawModalOpen(false)}
            availableBalance={
              depositStats.totalDeposited + depositStats.earnings
            }
            onWithdrawSuccess={() => fetchUserDepositData()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDepositsOverview;
