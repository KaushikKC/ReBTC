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
import Footer from "../components/Footer";
import { ethers } from "ethers";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useDataContext } from "@/context/DataContext";
import { toast } from "react-hot-toast";

// Import contract constants
import {
  INSURANCE_CONTRACT_ADDRESS,
  INSURANCE_CONTRACT_ABI,
} from "../../constants/contracts";

// Local storage keys
const POLICY_HISTORY_KEY = "insurancePolicyHistory";
const POLICY_HISTORY_TIMESTAMP_KEY = "insurancePolicyHistoryTimestamp";
const CLAIM_HISTORY_KEY = "insuranceClaimHistory";
const CLAIM_HISTORY_TIMESTAMP_KEY = "insuranceClaimHistoryTimestamp";
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function Insurance() {
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Contract state variables
  const [totalPoolBalance, setTotalPoolBalance] = useState(0);
  const [totalClaimsPaid, setTotalClaimsPaid] = useState(0);
  const [activePoliciesCount, setActivePoliciesCount] = useState(0);
  const [totalActiveCoverage, setTotalActiveCoverage] = useState(0);
  const [userPolicies, setUserPolicies] = useState([]);
  const [claimHistory, setClaimHistory] = useState([]);

  const { authenticated } = usePrivy();
  const { address } = useAccount();
  const { getContractInstance, provider } = useDataContext();

  // Load cached data on component mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window !== "undefined") {
          // Load policy history
          const cachedPolicyTimestampStr = localStorage.getItem(
            POLICY_HISTORY_TIMESTAMP_KEY
          );
          const cachedPoliciesStr = localStorage.getItem(POLICY_HISTORY_KEY);

          if (cachedPolicyTimestampStr && cachedPoliciesStr) {
            const cachedTimestamp = parseInt(cachedPolicyTimestampStr);
            const now = Date.now();

            // Check if cache is still valid
            if (now - cachedTimestamp < CACHE_EXPIRATION_TIME) {
              const cachedPolicies = JSON.parse(cachedPoliciesStr);
              setUserPolicies(cachedPolicies);
              console.log("Loaded policy history from cache");
            }
          }

          // Load claim history
          const cachedClaimTimestampStr = localStorage.getItem(
            CLAIM_HISTORY_TIMESTAMP_KEY
          );
          const cachedClaimsStr = localStorage.getItem(CLAIM_HISTORY_KEY);

          if (cachedClaimTimestampStr && cachedClaimsStr) {
            const cachedTimestamp = parseInt(cachedClaimTimestampStr);
            const now = Date.now();

            // Check if cache is still valid
            if (now - cachedTimestamp < CACHE_EXPIRATION_TIME) {
              const cachedClaims = JSON.parse(cachedClaimsStr);
              setClaimHistory(cachedClaims);
              console.log("Loaded claim history from cache");
            }
          }
        }
      } catch (error) {
        console.error("Error loading cached data:", error);
      }
    };

    // Try to load from cache first
    loadCachedData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (userPolicies.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(POLICY_HISTORY_KEY, JSON.stringify(userPolicies));
        localStorage.setItem(
          POLICY_HISTORY_TIMESTAMP_KEY,
          Date.now().toString()
        );
        console.log("Saved policy history to cache");
      } catch (error) {
        console.error("Error saving policy history to cache:", error);
      }
    }
  }, [userPolicies]);

  useEffect(() => {
    if (claimHistory.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(CLAIM_HISTORY_KEY, JSON.stringify(claimHistory));
        localStorage.setItem(
          CLAIM_HISTORY_TIMESTAMP_KEY,
          Date.now().toString()
        );
        console.log("Saved claim history to cache");
      } catch (error) {
        console.error("Error saving claim history to cache:", error);
      }
    }
  }, [claimHistory]);

  // Fetch contract data on component mount
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setIsLoading(true);

        const insuranceContract = await getContractInstance(
          INSURANCE_CONTRACT_ADDRESS,
          INSURANCE_CONTRACT_ABI
        );

        if (insuranceContract) {
          console.log("Insurance contract instance:", insuranceContract);

          try {
            // Fetch total pool balance
            const poolBalanceWei = await insuranceContract.poolBalance();
            console.log("Pool balance wei:", poolBalanceWei.toString());

            // Format with the correct decimals (8 for BTC)
            const poolBalance = parseFloat(
              ethers.utils.formatUnits(poolBalanceWei, 18)
            );
            setTotalPoolBalance(poolBalance);

            // Fetch total active coverage
            const totalCoverageWei =
              await insuranceContract.getTotalActiveCoverage();
            console.log("Total coverage wei:", totalCoverageWei.toString());

            const totalCoverage = parseFloat(
              ethers.utils.formatUnits(totalCoverageWei, 8)
            );
            setTotalActiveCoverage(totalCoverage);

            // Fetch policy count
            const policyCount = await insuranceContract.policyCount();
            console.log("Policy count:", policyCount.toString());
            setActivePoliciesCount(policyCount.toNumber());

            // Fetch user's policies if connected
            if (address) {
              await fetchUserPolicies(insuranceContract);
            }

            // Only fetch claim history if provider is available
            if (provider) {
              try {
                await fetchClaimHistory(insuranceContract);

                // Calculate total claims paid from events
                const totalClaims = claimHistory.reduce(
                  (sum, claim) => sum + claim.amount,
                  0
                );
                setTotalClaimsPaid(totalClaims);
              } catch (claimError) {
                console.error("Error fetching claim history:", claimError);
              }
            } else {
              console.warn(
                "Provider not available, skipping claim history fetch"
              );
            }
          } catch (contractError) {
            console.error("Error calling contract methods:", contractError);
            toast.error(
              "Error fetching insurance data. Please try again later."
            );
          }
        } else {
          console.error("Failed to get insurance contract instance");
          toast.error("Failed to connect to insurance contract");
        }
      } catch (error) {
        console.error("Error fetching contract data:", error);
        toast.error("Failed to load insurance data. Please try again later.");
      } finally {
        // Add a slight delay for the loading animation
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    fetchContractData();
  }, [address, provider]);

  // Fetch user's policies
  const fetchUserPolicies = async (contract) => {
    try {
      const policyIds = await contract.getUserPolicies(address);
      console.log("policyIds", policyIds);

      const policies = await Promise.all(
        policyIds.map(async (id) => {
          const policy = await contract.policies(id);
          console.log("policy", policy);

          // Map the policy data based on the actual contract response structure
          return {
            id: id.toString(),
            type: getCoverageTypeFromCode(policy.coverageType),
            coverageAmount: parseFloat(
              ethers.utils.formatUnits(policy.coverageAmount, 8) // Use 8 decimals for BTC
            ),
            premium: parseFloat(ethers.utils.formatUnits(policy.premium, 8)), // Use 8 decimals for BTC
            startDate: new Date(policy.startTimestamp.toNumber() * 1000)
              .toISOString()
              .split("T")[0],
            endDate: new Date(policy.expirationTimestamp.toNumber() * 1000)
              .toISOString()
              .split("T")[0],
            status: getStatusString(policy.status),
            claimed: policy.claimed,
            coverageType: policy.coverageType,
          };
        })
      );

      console.log("policies", policies);

      // Filter to only show active policies
      const activePolicies = policies.filter(
        (policy) => policy.status === "Active"
      );
      setUserPolicies(policies);
    } catch (error) {
      console.error("Error fetching user policies:", error);
    }
  };

  // Helper function to determine coverage type from details
  const getCoverageTypeFromCode = (coverageTypeCode) => {
    // Map numeric code to readable string based on your contract's enum values
    switch (Number(coverageTypeCode)) {
      case 0:
        return "Liquidation Protection";
      case 1:
        return "Smart Contract Risk";
      case 2:
        return "Slashing Protection";
      case 244: // Special case from your contract output
        return "General Coverage";
      default:
        return "Unknown Coverage Type";
    }
  };

  // Fetch claim history from events
  const fetchClaimHistory = async (contract) => {
    try {
      // Check if provider is available
      if (!provider) {
        console.error("Provider is not available");
        return;
      }

      // Get the current block number
      const currentBlock = await provider.getBlockNumber();

      // Look back 10000 blocks (adjust as needed)
      const fromBlock = Math.max(0, currentBlock - 10000);

      // Get ClaimPaid events
      const claimFilter = contract.filters.ClaimPaid();
      const claimEvents = await contract.queryFilter(claimFilter, fromBlock);
      console.log("Claim events:", claimEvents);

      // Process events
      const processedClaims = await Promise.all(
        claimEvents.map(async (event) => {
          try {
            const block = await event.getBlock();
            const timestamp = new Date(block.timestamp * 1000);

            // Get policy details
            const policy = await contract.policies(event.args.policyId);

            return {
              date: timestamp.toISOString().split("T")[0],
              type: getCoverageTypeFromCode(policy.coverageType),
              amount: parseFloat(
                ethers.utils.formatUnits(event.args.amount, 8)
              ), // Use 8 decimals for BTC
              status: "Approved",
              txHash: event.transactionHash,
              recipient: event.args.policyholder, // Using policyholder from event
            };
          } catch (eventError) {
            console.error(`Error processing claim event:`, eventError);
            return null;
          }
        })
      );

      // Filter out null claims and only show user's claims if connected
      const validClaims = processedClaims.filter((claim) => claim !== null);
      const userClaims = address
        ? validClaims.filter(
            (claim) => claim.recipient.toLowerCase() === address.toLowerCase()
          )
        : validClaims;

      // Sort by date (most recent first)
      userClaims.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      setClaimHistory(userClaims);
    } catch (error) {
      console.error("Error fetching claim history:", error);
    }
  };

  const getStatusString = (statusCode) => {
    // Convert to number to ensure consistent comparison
    const status = Number(statusCode);

    if (status === 0) return "Active";
    if (status === 1) return "Expired";
    if (status === 2) return "Claimed";
    if (status === 30) return "Claimed"; // Special case from your contract

    return "Unknown";
  };

  const handleClaimClick = (policy) => {
    setSelectedPolicy(policy);
    setShowClaimModal(true);
  };

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

  // Format stats for display
  const stats = [
    {
      title: "Total Insurance Pool",
      value: `${Number(totalPoolBalance).toFixed(4)} lstBTC`,
      icon: FaShieldAlt,
    },
    {
      title: "Total Claims Paid",
      value: `${totalClaimsPaid.toFixed(4)} lstBTC`,
      icon: FaCoins,
    },
    {
      title: "Active Policies",
      value: activePoliciesCount.toLocaleString(),
      icon: FaHistory,
    },
  ];

  if (isLoading) {
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
                lstBTC Insurance Pool
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
              Insurance History
            </h3>

            {!authenticated ? (
              <div className="text-center py-8 text-gray-400">
                Please connect your wallet to view your active insurance
                policies
              </div>
            ) : userPolicies.length === 0 ? (
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
                  {userPolicies.map((policy, index) => (
                    <motion.tr
                      key={policy.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-t border-[#2D333B] text-white"
                    >
                      <td className="py-4">{policy.id}</td>
                      <td className="py-4">{policy.type}</td>
                      <td className="py-4">
                        {policy.coverageAmount.toFixed(4)} lstBTC
                      </td>
                      <td className="py-4">
                        {policy.premium.toFixed(4)} lstBTC
                      </td>
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
                onRepaymentSuccess={() => {
                  // Refresh data after successful claim
                  fetchUserPolicies();
                  fetchClaimHistory();
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>
    </div>
  );
}
