"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaCoins,
  FaBitcoin,
  FaChevronDown,
  FaWater,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useDataContext } from "@/context/DataContext";
import { ethers } from "ethers";

// Import contract constants
import {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  TOKEN_ABI,
  FAUCET_CONTRACT_ADDRESS,
  FAUCET_CONTRACT_ABI,
} from "../../constants/contracts";

const TokenMintModal = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState("btc");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  // Token options
  const tokenOptions = [
    {
      id: "btc",
      name: "Bitcoin",
      symbol: "BTC",
      address: BTC_TOKEN_ADDRESS,
      color: "#F7931A",
      icon: FaBitcoin,
      decimals: 8,
      requestFunction: "requestBTC",
    },
    {
      id: "lstbtc",
      name: "Liquid Staked Bitcoin",
      symbol: "lstBTC",
      address: LSTBTC_TOKEN_ADDRESS,
      color: "#2F80ED",
      icon: FaCoins,
      decimals: 18,
      requestFunction: "requestlstBTC",
    },
  ];

  // Get current token info
  const tokenInfo =
    tokenOptions.find((token) => token.id === selectedToken) || tokenOptions[0];

  const handleRequestTokens = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);

      // Get faucet contract instance
      const faucetContract = await getContractInstance(
        FAUCET_CONTRACT_ADDRESS,
        FAUCET_CONTRACT_ABI
      );

      if (!faucetContract) {
        throw new Error("Failed to initialize faucet contract");
      }

      // Get token contract instance (for checking balance later)
      const tokenContract = await getContractInstance(
        tokenInfo.address,
        TOKEN_ABI
      );

      if (!tokenContract) {
        throw new Error("Failed to initialize token contract");
      }

      // Call the appropriate faucet function based on selected token
      toast.loading(`Requesting ${tokenInfo.symbol} from faucet...`);

      // Call the request function dynamically based on the selected token
      const tx = await faucetContract[tokenInfo.requestFunction]();

      // Wait for transaction to be mined
      await tx.wait();
      toast.dismiss();

      // Check token balance to confirm receipt
      const balanceBefore = await tokenContract.balanceOf(address);

      // Wait a moment for the balance to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check updated balance
      const balanceAfter = await tokenContract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(
        balanceAfter,
        tokenInfo.decimals
      );

      // Calculate received amount
      const received = balanceAfter.sub(balanceBefore);
      const formattedReceived = ethers.utils.formatUnits(
        received,
        tokenInfo.decimals
      );

      toast.success(
        `Successfully received ${formattedReceived} ${
          tokenInfo.symbol
        }! Your balance: ${parseFloat(formattedBalance).toFixed(4)} ${
          tokenInfo.symbol
        }`
      );
      onClose();
    } catch (error) {
      console.error("Faucet error:", error);
      toast.dismiss();

      // Handle specific error cases
      if (error.message.includes("daily limit")) {
        toast.error(
          `You've reached the daily limit for ${tokenInfo.symbol} faucet requests`
        );
      } else if (error.message.includes("wait")) {
        toast.error(`Please wait before requesting more ${tokenInfo.symbol}`);
      } else if (error.message.includes("empty")) {
        toast.error(`The faucet is out of ${tokenInfo.symbol}`);
      } else {
        toast.error(error.message || `Failed to request ${tokenInfo.symbol}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = tokenInfo.icon || FaCoins;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FaWater className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Token Faucet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Token Selection Dropdown */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Select Token
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-[#2D333B] p-4 rounded-lg hover:bg-[#373E47] transition-colors"
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <Icon style={{ color: tokenInfo.color }} className="text-xl" />
                <span className="text-white">
                  {tokenInfo.name} ({tokenInfo.symbol})
                </span>
              </div>
              <FaChevronDown className="text-gray-400" />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute w-full mt-2 bg-[#2D333B] rounded-lg shadow-xl z-10"
                >
                  {tokenOptions.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => {
                        setSelectedToken(token.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-3 hover:bg-[#373E47] text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {token.icon && (
                        <token.icon
                          style={{ color: token.color }}
                          className="text-xl"
                        />
                      )}
                      {token.name} ({token.symbol})
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Faucet Info */}
        <div className="bg-[#2D333B] p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#1C2128] rounded-lg">
              <Icon style={{ color: tokenInfo.color }} className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-white">{tokenInfo.name} Faucet</h3>
              <p className="text-gray-400 text-sm">
                Get test tokens for development
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-white">Testnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Wallet:</span>
              <span className="text-white">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-sm">
            <strong>Note:</strong> This faucet provides test tokens for
            development purposes. These tokens have no real value and are only
            available on testnet.
          </p>
        </div>

        {/* Request Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRequestTokens}
          disabled={!address || isLoading}
          className={`w-full py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
            ${
              !address || isLoading
                ? "opacity-50 cursor-not-allowed bg-gray-500 text-white"
                : "text-white"
            }`}
          style={{
            backgroundColor:
              !address || isLoading ? undefined : tokenInfo.color,
          }}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <FaWater />
              Request {tokenInfo.symbol}
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default TokenMintModal;
