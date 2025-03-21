"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExclamationTriangle, FaFileAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useDataContext } from "@/context/DataContext";
import { ethers } from "ethers";
import TimeLoader from "./TimeLoader";
import { INSURANCE_POOL_ADDRESS } from "../../constants/contracts";
// ABI for the insurance contract
const INSURANCE_CONTRACT_ABI = [
  "function claimInsurance(uint256 _policyId, uint256 _claimAmount) external",
  "function policies(uint256 _policyId) external view returns (address policyholder, uint256 coverageAmount, uint256 premiumAmount, uint256 startTimestamp, uint256 expirationTimestamp, uint8 status, bool claimed)",
];

// Token ABI for lstBTC
const LST_BTC_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

const ClaimModal = ({ policy, onClose }) => {
  const [claimAmount, setClaimAmount] = useState("");
  const [claimReason, setClaimReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

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
    "General Coverage": [
      "Validator slashing due to network issues",
      "Slashing due to client bugs",
      "Unintentional double signing",
    ],
  };

  const handleSubmitClaim = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

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
      setIsProcessing(true);
      setProcessingStep("Preparing your claim...");

      // Get insurance contract instance
      const insuranceContract = await getContractInstance(
        INSURANCE_POOL_ADDRESS,
        INSURANCE_CONTRACT_ABI
      );

      if (!insuranceContract) {
        throw new Error("Failed to get contract instance");
      }

      // Convert claim amount to the appropriate format (assuming BTC has 8 decimals)
      const claimAmountInWei = ethers.utils.parseUnits(
        claimAmount.toString(),
        8
      );

      setProcessingStep("Submitting claim to the blockchain...");

      // Call the claimInsurance function from the smart contract
      const tx = await insuranceContract.claimInsurance(
        policy.id, // Policy ID
        claimAmountInWei // Claim amount in wei
      );

      setProcessingStep("Waiting for transaction confirmation...");

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Update based on transaction status
      if (receipt.status === 1) {
        setIsSuccess(true);
        setProcessingStep("Claim submitted successfully!");

        // Show success toast
        toast.success("Claim submitted successfully");

        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error submitting claim:", error);
      setIsProcessing(false);

      // Handle specific error messages
      if (error.message.includes("Policy is not active")) {
        toast.error("This policy is not active");
      } else if (error.message.includes("Only the policyholder can claim")) {
        toast.error("Only the policyholder can submit a claim");
      } else if (error.message.includes("Policy has expired")) {
        toast.error("This policy has expired");
      } else if (error.message.includes("Policy has already been claimed")) {
        toast.error("This policy has already been claimed");
      } else if (error.message.includes("Amount exceeds coverage")) {
        toast.error("Claim amount exceeds policy coverage");
      } else if (error.message.includes("Insufficient funds in the pool")) {
        toast.error("Insufficient funds in the insurance pool");
      } else {
        toast.error("Failed to submit claim. Please try again.");
      }
    } finally {
      setIsLoading(false);
      // Note: We don't reset isProcessing here if successful to keep showing the success state
    }
  };

  const renderStepOne = () => (
    <>
      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2">
          Claim Amount (lstBTC)
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
          Maximum coverage: {policy.coverageAmount} lstBTC
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
            <span className="text-white">{claimAmount} lstBTC</span>
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
          onClick={() => handleSubmitClaim()}
          disabled={isLoading}
          className={`flex-1 ${
            isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#F7931A] hover:bg-[#F7931A]/90 cursor-pointer"
          } text-white py-3 rounded-lg font-medium transition-colors`}
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
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md relative"
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
              <span className="text-white">{policy.coverageAmount} lstBTC</span>
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

        {/* Processing Overlay */}
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
    </motion.div>
  );
};

export default ClaimModal;
