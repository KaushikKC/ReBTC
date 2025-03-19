"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaExclamationTriangle, FaFileAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useDataContext } from "@/context/DataContext";
import { ethers } from "ethers";

const ClaimModal = ({ policy, onClose }) => {
  const [claimAmount, setClaimAmount] = useState("");
  const [claimReason, setClaimReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { address } = useAccount();
  const { getContractInstance } = useDataContext();

  const claimTypes = {
    "Liquidation Protection": [
      "Unexpected liquidation due to oracle failure",
      "Liquidation due to market manipulation",
      "Liquidation due to platform technical issues",
    ],
    "Smart Contract Risk": [
      "Smart contract exploit",
      "Protocol hack",
      "Funds locked in contract",
    ],
    "Slashing Protection": [
      "Validator slashing due to network issues",
      "Slashing due to client bugs",
      "Unintentional double signing",
    ],
  };

  const handleSubmitClaim = async () => {
    if (!claimAmount || !claimReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      parseFloat(claimAmount) <= 0 ||
      parseFloat(claimAmount) > parseFloat(policy.coverageAmount)
    ) {
      toast.error(
        `Claim amount must be between 0 and ${policy.coverageAmount} BTC`
      );
      return;
    }

    try {
      setIsLoading(true);

      // This would be replaced with actual contract interaction
      // For now, we'll simulate a successful claim submission

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Claim submitted successfully");
      onClose();
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast.error("Failed to submit claim. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepOne = () => (
    <>
      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2">
          Claim Amount (BTC)
        </label>
        <input
          type="number"
          value={claimAmount}
          onChange={(e) => setClaimAmount(e.target.value)}
          className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
          placeholder="0.00"
          max={policy.coverageAmount}
          disabled={isLoading}
        />
        <p className="text-sm text-gray-400 mt-2">
          Maximum coverage: {policy.coverageAmount} BTC
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2">Claim Reason</label>
        <select
          value={claimReason}
          onChange={(e) => setClaimReason(e.target.value)}
          className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
          disabled={isLoading}
        >
          <option value="">Select a reason</option>
          {claimTypes[policy.type]?.map((reason, index) => (
            <option key={index} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setStep(2)}
        disabled={!claimAmount || !claimReason || isLoading}
        className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
          ${
            !claimAmount || !claimReason || isLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[#F7931A]/90"
          }`}
      >
        Continue
      </motion.button>
    </>
  );

  const renderStepTwo = () => (
    <>
      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2">
          Evidence URL (Optional)
        </label>
        <input
          type="text"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
          placeholder="https://..."
          disabled={isLoading}
        />
        <p className="text-sm text-gray-400 mt-2">
          Provide a link to transaction hash, screenshots, or other evidence
        </p>
      </div>

      <div className="bg-[#2D333B] p-4 rounded-lg mb-6">
        <h4 className="text-white font-medium mb-2">Claim Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Policy ID:</span>
            <span className="text-white">{policy.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white">{policy.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Claim Amount:</span>
            <span className="text-white">{claimAmount} BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Reason:</span>
            <span className="text-white">{claimReason}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStep(1)}
          disabled={isLoading}
          className="flex-1 bg-[#2D333B] text-white py-3 rounded-lg font-medium hover:bg-[#2D333B]/80 transition-colors"
        >
          Back
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmitClaim}
          disabled={isLoading}
          className="flex-1 bg-[#F7931A] text-white py-3 rounded-lg font-medium hover:bg-[#F7931A]/90 transition-colors"
        >
          {isLoading ? "Processing..." : "Submit Claim"}
        </motion.button>
      </div>

      <div className="flex items-start gap-2 text-yellow-500 text-sm">
        <FaExclamationTriangle className="mt-1 flex-shrink-0" />
        <p>
          By submitting this claim, you confirm that all information provided is
          accurate. False claims may result in policy termination and legal
          action.
        </p>
      </div>
    </>
  );

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
            <FaFileAlt className="text-[#F7931A]" />
            <h2 className="text-xl font-bold text-white">
              File Insurance Claim
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Policy Details */}
        <div className="bg-[#2D333B] p-4 rounded-lg mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Policy ID:</span>
              <span className="text-white">{policy.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{policy.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Coverage:</span>
              <span className="text-white">{policy.coverageAmount} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expiry:</span>
              <span className="text-white">{policy.endDate}</span>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex mb-6">
          <div
            className={`flex-1 h-1 rounded-l-full ${
              step >= 1 ? "bg-[#F7931A]" : "bg-[#2D333B]"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-r-full ${
              step >= 2 ? "bg-[#F7931A]" : "bg-[#2D333B]"
            }`}
          />
        </div>

        {/* Form Steps */}
        {step === 1 ? renderStepOne() : renderStepTwo()}
      </motion.div>
    </motion.div>
  );
};

export default ClaimModal;
