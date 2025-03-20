"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import SqueezeButton from "../components/SqueezeButton";
import { FaBitcoin, FaChevronDown, FaExchangeAlt } from "react-icons/fa";
import RepaymentModal from "../components/RepaymentModal";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Chart from "../components/Chart";
import { useAccount, useBalance } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useDataContext } from "@/context/DataContext";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";
// Import contract constants
import {
  LENDING_CONTRACT_ADDRESS,
  LENDING_CONTRACT_ABI,
  LSTBTC_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
  USDT_TOKEN_ADDRESS,
  TOKEN_ABI,
} from "../../constants/contracts";

const StablecoinLoan = () => {
  const [collateralAmount, setCollateralAmount] = useState("");
  const [selectedStablecoin, setSelectedStablecoin] = useState("USDC");
  const [ltvPercentage, setLtvPercentage] = useState(50);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [btcPrice, setBtcPrice] = useState(65000); // Default price, will be fetched from contract
  const [isLoading, setIsLoading] = useState(false);
  const [loanPositions, setLoanPositions] = useState([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [hasCollateral, setHasCollateral] = useState(false);
  const [currentCollateral, setCurrentCollateral] = useState(0);

  const MAX_LTV = 75; // Maximum LTV allowed by the contract

  const { address, isConnected } = useAccount();
  const { ready, authenticated } = usePrivy();
  const { getContractInstance } = useDataContext();

  // Get BTC balance
  const { data: btcBalanceData } = useBalance({
    address,
    token: LSTBTC_TOKEN_ADDRESS,
    watch: true,
  });

  const availableBtcBalance = btcBalanceData
    ? parseFloat(ethers.utils.formatUnits(btcBalanceData.value, 18)) // lstBTC has 18 decimals
    : 0;

  // Calculate loan amount based on collateral and LTV
  const calculateLoanAmount = () => {
    if (!collateralAmount) return 0;

    // Apply 2:1 ratio for lstBTC to USDT/USDC
    // 2 lstBTC = 1 USDT/USDC in value
    const collateralValue = collateralAmount / 2;

    return collateralValue;
  };

  // Calculate interest rate based on LTV
  const calculateInterestRate = () => {
    const ltv = ltvPercentage;
    if (ltv <= 50) return 2;
    if (ltv <= 65) return 2.5;
    return 3;
  };

  // Set due date (30 days from now)
  useEffect(() => {
    const calculatedDueDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString();
    setDueDate(calculatedDueDate);
  }, []);

  // Fetch BTC price and user loans when component mounts or address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchBtcPrice();
      fetchUserLoanPosition();
    } else {
      setIsLoadingLoans(false);
    }
  }, [address, isConnected]);

  // Fetch BTC price from contract or oracle
  const fetchBtcPrice = async () => {
    try {
      const lendingContract = await getContractInstance(
        LENDING_CONTRACT_ADDRESS,
        LENDING_CONTRACT_ABI
      );

      if (lendingContract) {
        // Try to get BTC price from contract
        try {
          const price = await lendingContract.getBtcPrice();
          setBtcPrice(parseFloat(ethers.utils.formatUnits(price, 8)));
        } catch (error) {
          console.warn(
            "Could not fetch BTC price from contract, using default",
            error
          );
          // Keep using default price
        }
      }
    } catch (error) {
      console.error("Error initializing lending contract:", error);
    }
  };

  // Fetch user's loan position
  const fetchUserLoanPosition = async () => {
    try {
      setIsLoadingLoans(true);

      const lendingContract = await getContractInstance(
        LENDING_CONTRACT_ADDRESS,
        LENDING_CONTRACT_ABI
      );

      if (lendingContract && address) {
        // Get user's loan position
        const position = await lendingContract.loanPositions(address);

        // Check if user has collateral
        const hasCollateralDeposited = position.collateralAmount.gt(0);
        setHasCollateral(hasCollateralDeposited);

        if (hasCollateralDeposited) {
          // Format collateral amount
          const collateralAmount = parseFloat(
            ethers.utils.formatUnits(position.collateralAmount, 18)
          ); // lstBTC uses 18 decimals
          setCurrentCollateral(collateralAmount);

          // Get total debt
          const totalDebt = await lendingContract.getTotalDebt(address);

          // Check if user has USDC debt
          const usdcDebt = position.borrowedUSDC;
          const hasUsdcDebt = usdcDebt.gt(0);

          // Check if user has USDT debt
          const usdtDebt = position.borrowedUSDT;
          const hasUsdtDebt = usdtDebt.gt(0);

          const loans = [];

          // Add USDC loan if exists
          if (hasUsdcDebt) {
            const formattedLoan = {
              id: `USDC-${address.slice(0, 6)}`,
              collateral: collateralAmount,
              borrowed: parseFloat(ethers.utils.formatUnits(usdcDebt, 6)), // USDC uses 6 decimals
              currency: "USDC",
              interest: 2.5, // This should be fetched from contract if available
              dueDate: "Ongoing", // Loans don't have fixed due dates in this contract
              status: "active",
              type: "usdc",
            };

            loans.push(formattedLoan);
          }

          // Add USDT loan if exists
          if (hasUsdtDebt) {
            const formattedLoan = {
              id: `USDT-${address.slice(0, 6)}`,
              collateral: collateralAmount,
              borrowed: parseFloat(ethers.utils.formatUnits(usdtDebt, 6)), // USDT uses 6 decimals
              currency: "USDT",
              interest: 2.5, // This should be fetched from contract if available
              dueDate: "Ongoing", // Loans don't have fixed due dates in this contract
              status: "active",
              type: "usdt",
            };

            loans.push(formattedLoan);
          }

          setLoanPositions(loans);
        } else {
          setLoanPositions([]);
        }
      }
    } catch (error) {
      console.error("Error fetching user loan position:", error);
      toast.error("Failed to load your loan position. Please try again later.");
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Handle borrowing stablecoins using depositAndBorrow function
  const handleBorrow = async () => {
    if (!authenticated || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      toast.error("Please enter a valid collateral amount");
      return;
    }

    try {
      setIsLoading(true);

      // Get contract instances
      const lendingContract = await getContractInstance(
        LENDING_CONTRACT_ADDRESS,
        LENDING_CONTRACT_ABI
      );

      const btcToken = await getContractInstance(
        LSTBTC_TOKEN_ADDRESS,
        TOKEN_ABI
      );

      if (!lendingContract || !btcToken) {
        throw new Error("Failed to initialize contracts");
      }

      // Convert collateral amount to wei
      const collateralInWei = ethers.utils.parseUnits(
        collateralAmount,
        18 // lstBTC has 18 decimals
      );

      // Calculate loan amount in wei
      const loanAmountInWei = ethers.utils.parseUnits(
        calculateLoanAmount().toString(),
        18 // USDC and USDT both use 6 decimals
      );

      // Step 1: Approve lstBTC transfer for collateral
      toast.loading("Approving lstBTC transfer...");
      const approveTx = await btcToken.approve(
        LENDING_CONTRACT_ADDRESS,
        collateralInWei
      );
      await approveTx.wait();
      toast.dismiss();

      // Step 2: Call depositAndBorrow function
      toast.loading(
        `Depositing collateral and borrowing ${selectedStablecoin}...`
      );
      const isUSDT = selectedStablecoin === "USDT";

      const borrowTx = await lendingContract.depositAndBorrow(
        collateralInWei,
        loanAmountInWei,
        isUSDT
      );

      await borrowTx.wait();
      toast.dismiss();

      toast.success(
        `Successfully borrowed ${calculateLoanAmount().toLocaleString()} ${selectedStablecoin}`
      );

      // Reset form and refresh loans
      setCollateralAmount("");
      fetchUserLoanPosition();
    } catch (error) {
      console.error("Borrow error:", error);
      toast.dismiss();

      // Handle specific error messages
      if (error.message.includes("Transfer failed")) {
        toast.error(
          "Failed to transfer lstBTC. Please check your balance and approval."
        );
      } else if (error.message.includes("Borrow would exceed LTV ratio")) {
        toast.error(
          "Borrow amount would exceed the maximum LTV ratio. Please reduce the amount."
        );
      } else if (error.message.includes("Insufficient")) {
        toast.error(
          `Insufficient ${selectedStablecoin} in the contract. Please try a smaller amount or different stablecoin.`
        );
      } else {
        toast.error(`Failed to borrow: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loan repayment success
  const handleRepaymentSuccess = () => {
    fetchUserLoanPosition();
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

  return (
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
      <Navbar />

      {/* Navigation Buttons */}
      <div className="flex-grow flex flex-col items-center px-4 pt-32">
        <div className="flex flex-wrap justify-center pb-16 gap-4 md:gap-8 w-full max-w-7xl">
          <SqueezeButton text={"Deposit & Yield Vault"} to="/deposit" />
          <SqueezeButton text={"Borrow Against BTC"} to="/stablecoin-loan" />
          <SqueezeButton text={"Instant Liquidity"} to="/flash-loan" />
          <SqueezeButton text={"BTC Insurance Pool"} to="/insurance" />
        </div>

        {/* Main Content - Form and Chart */}
        <div className="w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-6 mb-8 px-4 md:px-8">
            {/* Borrowing Form Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1C2128] rounded-xl p-6 shadow-lg w-full lg:w-[400px] flex-shrink-0"
            >
              {/* Current Collateral Display (if any) */}
              {hasCollateral && (
                <div className="mb-6 bg-[#2D333B] p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-2">
                    Current Collateral
                  </h3>
                  <p className="text-xl font-bold text-white">
                    {currentCollateral.toFixed(8)} lstBTC
                  </p>
                </div>
              )}

              {/* Collateral Input */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">
                  lstBTC Collateral Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
                    placeholder="0.00"
                    max={availableBtcBalance}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() =>
                      setCollateralAmount(availableBtcBalance.toString())
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#2F80ED] text-white px-3 py-1 rounded-md text-sm hover:bg-[#2F80ED]/80 transition-colors"
                    disabled={isLoading}
                  >
                    MAX
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Available: {availableBtcBalance.toFixed(8)} lstBTC
                </p>
                <p className="text-sm text-blue-400 mt-1">
                  Note: 2 lstBTC = 1 {selectedStablecoin} in value
                </p>
              </div>

              {/* LTV Slider */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">
                  Loan to Value (LTV) - {ltvPercentage}%
                </label>
                <Slider
                  min={1}
                  max={MAX_LTV}
                  value={ltvPercentage}
                  onChange={setLtvPercentage}
                  trackStyle={{ backgroundColor: "#F7931A" }}
                  handleStyle={{
                    borderColor: "#F7931A",
                    backgroundColor: "#F7931A",
                  }}
                  railStyle={{ backgroundColor: "#2D333B" }}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>1%</span>
                  <span>{MAX_LTV}%</span>
                </div>
              </div>

              {/* Stablecoin Selection */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">
                  Select Stablecoin
                </label>
                <div className="flex gap-4">
                  {["USDC", "USDT"].map((coin) => (
                    <motion.button
                      key={coin}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStablecoin(coin)}
                      className={`flex-1 py-3 rounded-lg transition-colors ${
                        selectedStablecoin === coin
                          ? "bg-[#F7931A] text-white"
                          : "bg-[#2D333B] text-gray-300"
                      }`}
                      disabled={isLoading}
                    >
                      {coin}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-[#2D333B] p-4 rounded-lg mb-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400">Loan Amount</p>
                    <p className="text-xl font-bold text-white">
                      {calculateLoanAmount().toLocaleString()}{" "}
                      {selectedStablecoin}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Interest Rate</p>
                    <p className="text-xl font-bold text-white">
                      {calculateInterestRate()}% APR
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Current BTC Price</p>
                    <p className="text-xl font-bold text-white">
                      ${btcPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Collateral Ratio</p>
                    <p className="text-xl font-bold text-white">
                      2:1 (lstBTC:{selectedStablecoin})
                    </p>
                  </div>
                </div>
              </div>

              {/* Authentication Check */}
              {!authenticated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-yellow-400 text-sm mb-4 text-center"
                >
                  Please connect your wallet to borrow
                </motion.div>
              )}

              {/* Borrow Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBorrow}
                disabled={
                  !authenticated ||
                  !collateralAmount ||
                  collateralAmount <= 0 ||
                  isLoading
                }
                className={`w-full bg-[#F7931A] text-white py-4 rounded-lg font-medium transition-colors
                ${
                  !authenticated ||
                  !collateralAmount ||
                  collateralAmount <= 0 ||
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#F7931A]/90"
                }`}
              >
                {isLoading ? "Processing..." : `Borrow ${selectedStablecoin}`}
              </motion.button>
            </motion.div>

            {/* Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-grow rounded-xl p-6 shadow-lg"
            >
              <div className="h-full min-h-[500px] flex items-center justify-center">
                <Chart />
              </div>
            </motion.div>
          </div>

          {/* Active Loans Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1C2128] rounded-xl p-6 mb-8 shadow-lg overflow-x-auto mx-4 md:mx-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Active Loans</h2>

            {isLoadingLoans ? (
              <div className="text-center py-8 text-gray-400">
                Loading your loans...
              </div>
            ) : loanPositions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                You don't have any active loans
              </div>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="pb-4">Loan ID</th>
                    <th className="pb-4">lstBTC Collateral</th>
                    <th className="pb-4">Borrowed Amount</th>
                    <th className="pb-4">Interest Rate</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loanPositions.map((loan) => (
                    <tr key={loan.id} className="border-t border-[#2D333B]">
                      <td className="py-4 text-white">{loan.id}</td>
                      <td className="py-4 text-white">
                        {loan.collateral.toFixed(8)} lstBTC
                      </td>
                      <td className="py-4 text-white">
                        {loan.borrowed.toLocaleString()} {loan.currency}
                      </td>
                      <td className="py-4 text-white">
                        {loan.interest}% (
                        {(
                          (loan.borrowed * loan.interest) /
                          100
                        ).toLocaleString()}{" "}
                        {loan.currency})
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              loan.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowRepayModal(true);
                          }}
                          className="bg-[#2F80ED] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2F80ED]/90 transition-colors"
                        >
                          Repay
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </div>
      </div>

      {/* Repayment Modal */}
      <AnimatePresence>
        {showRepayModal && (
          <RepaymentModal
            loan={selectedLoan}
            onClose={() => setShowRepayModal(false)}
            onRepaymentSuccess={handleRepaymentSuccess}
          />
        )}
      </AnimatePresence>

      <motion.footer variants={sectionVariants} className="relative z-10">
        <Footer />
      </motion.footer>
    </div>
  );
};

export default StablecoinLoan;
