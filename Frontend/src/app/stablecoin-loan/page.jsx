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
import { toast, Toaster } from "react-hot-toast"; // Import Toaster component
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
  const [contractLtvRatio, setContractLtvRatio] = useState(70); // Default LTV ratio from contract (70%)
  const [originationFee, setOriginationFee] = useState(0.5); // Default origination fee (0.5%)
  const [interestRate, setInterestRate] = useState(2.5); // Default interest rate (2.5%)

  const MAX_LTV = 70; // Maximum LTV allowed by the contract (70%)

  const { address, isConnected } = useAccount();
  const { ready, authenticated } = usePrivy();
  const { getContractInstance } = useDataContext();

  // Get BTC balance
  const { data: btcBalanceData } = useBalance({
    address,
    token: LSTBTC_TOKEN_ADDRESS,
    watch: true,
  });

  const PROFILE_TRANSACTIONS_KEY = "transactions";

  // Custom toast for loan success
  const showLoanSuccessToast = (receipt, amount, stablecoin) => {
    const shortenedTxId = `${receipt.transactionHash.substring(
      0,
      6
    )}...${receipt.transactionHash.substring(62)}`;

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-[#2D333B] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-[#F7931A] flex items-center justify-center text-white">
                  💰
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  Loan Successfully Processed!
                </p>
                <p className="mt-1 text-xs text-gray-300">
                  You've borrowed {amount.toLocaleString()} {stablecoin} using
                  lstBTC as collateral.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Transaction ID:{" "}
                  <span className="font-mono">{shortenedTxId}</span>
                </p>
                <a
                  href={`https://scan.test2.btcs.network/tx/${receipt.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  View on Core Testnet
                </a>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-600">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  // Helper function to save transaction to profile storage
  const saveTransactionToProfile = (transaction) => {
    try {
      // Get existing transactions from local storage
      const existingTransactions = JSON.parse(
        localStorage.getItem(PROFILE_TRANSACTIONS_KEY) || "[]"
      );

      // Check if transaction with same hash already exists
      const existingIndex = existingTransactions.findIndex(
        (tx) => tx.hash === transaction.hash
      );

      if (existingIndex >= 0) {
        // Update existing transaction
        existingTransactions[existingIndex] = {
          ...existingTransactions[existingIndex],
          ...transaction,
        };
      } else {
        // Add new transaction
        existingTransactions.push(transaction);
      }

      // Save back to local storage
      localStorage.setItem(
        PROFILE_TRANSACTIONS_KEY,
        JSON.stringify(existingTransactions)
      );
      console.log("Saved transaction to profile storage");
      return true;
    } catch (error) {
      console.error("Error saving transaction to profile storage:", error);
      return false;
    }
  };

  const availableBtcBalance = btcBalanceData
    ? parseFloat(ethers.utils.formatUnits(btcBalanceData.value, 18)) // lstBTC has 18 decimals
    : 0;

  // Calculate loan amount based on collateral and LTV
  const calculateLoanAmount = () => {
    if (!collateralAmount) return 0;

    // Apply 2:1 ratio for lstBTC to USDT/USDC
    // 2 lstBTC = 1 USDT/USDC in value
    const collateralValue = parseFloat(collateralAmount) / 2;

    // Apply LTV percentage
    const loanAmount = (collateralValue * ltvPercentage) / 100;

    // Subtract origination fee
    const fee = (loanAmount * originationFee) / 100;
    const amountAfterFee = loanAmount - fee;

    return collateralValue;
  };

  // Set due date (30 days from now)
  useEffect(() => {
    const calculatedDueDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString();
    setDueDate(calculatedDueDate);
  }, []);

  // Fetch contract data when component mounts or address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchContractData();
      fetchUserLoanPosition();
    } else {
      setIsLoadingLoans(false);
    }
  }, [address, isConnected]);

  // Fetch contract data (BTC price, LTV ratio, fees, etc.)
  const fetchContractData = async () => {
    try {
      const lendingContract = await getContractInstance(
        LENDING_CONTRACT_ADDRESS,
        LENDING_CONTRACT_ABI
      );

      if (lendingContract) {
        // Fetch BTC price
        try {
          const price = await lendingContract.getBtcPrice();
          setBtcPrice(parseFloat(ethers.utils.formatUnits(price, 8)));
        } catch (error) {
          console.warn(
            "Could not fetch BTC price from contract, using default",
            error
          );
        }

        // Try to fetch LTV ratio if available
        try {
          // This assumes there's a function to get the LTV ratio
          // If not available, we'll use the default value
          const ltvRatio = await lendingContract.LTV_RATIO();
          setContractLtvRatio(ltvRatio.toNumber() / 100); // Convert from basis points (e.g., 7000) to percentage (70)
          setLtvPercentage(ltvRatio.toNumber() / 200); // Set default slider to half of max
        } catch (error) {
          console.warn("Could not fetch LTV ratio, using default", error);
        }

        // Try to fetch origination fee if available
        try {
          const fee = await lendingContract.ORIGINATION_FEE();
          setOriginationFee(fee.toNumber() / 100); // Convert from basis points to percentage
        } catch (error) {
          console.warn("Could not fetch origination fee, using default", error);
        }

        // Try to fetch interest rate if available
        try {
          const rate = await lendingContract.getInterestRate();
          setInterestRate(rate.toNumber() / 100); // Convert from basis points to percentage
        } catch (error) {
          console.warn("Could not fetch interest rate, using default", error);
        }
      }
    } catch (error) {
      console.error("Error fetching contract data:", error);
      toast.error("Failed to fetch market data. Using default values.");
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

          // Get collateral value
          const collateralValue = await lendingContract.getCollateralValue(
            position.collateralAmount
          );

          // Calculate current LTV
          const currentLtv =
            totalDebt.gt(0) && collateralValue.gt(0)
              ? totalDebt.mul(10000).div(collateralValue).toNumber() / 100
              : 0;

          // Check if user has USDC debt
          const usdcDebt = position.borrowedUSDC;
          const hasUsdcDebt = usdcDebt.gt(0);

          // Check if user has USDT debt
          const usdtDebt = position.borrowedUSDT;
          const hasUsdtDebt = usdtDebt.gt(0);

          // Try to get accumulated interest
          let accumulatedInterest = 0;
          try {
            if (position.lastInterestCalcTimestamp) {
              // Calculate time elapsed since last interest calculation
              const timeElapsed =
                Math.floor(Date.now() / 1000) -
                position.lastInterestCalcTimestamp.toNumber();

              // Calculate accumulated interest (simplified)
              accumulatedInterest = parseFloat(
                ethers.utils.formatUnits(
                  position.accumulatedInterest || ethers.BigNumber.from(0),
                  6
                )
              );
            }
          } catch (error) {
            console.warn("Could not calculate accumulated interest", error);
          }

          const loans = [];

          // Add USDC loan if exists
          if (hasUsdcDebt) {
            const formattedLoan = {
              id: `USDC-${address.slice(0, 6)}`,
              collateral: collateralAmount,
              borrowed: parseFloat(ethers.utils.formatUnits(usdcDebt, 18)), // USDC uses 6 decimals
              currency: "USDC",
              interest: interestRate, // Use the fetched interest rate
              dueDate: "Ongoing", // Loans don't have fixed due dates in this contract
              status: "active",
              type: "usdc",
              ltv: currentLtv,
              accumulatedInterest: accumulatedInterest,
            };

            loans.push(formattedLoan);
          }

          // Add USDT loan if exists
          if (hasUsdtDebt) {
            const formattedLoan = {
              id: `USDT-${address.slice(0, 6)}`,
              collateral: collateralAmount,
              borrowed: parseFloat(ethers.utils.formatUnits(usdtDebt, 18)), // USDT uses 6 decimals
              currency: "USDT",
              interest: interestRate, // Use the fetched interest rate
              dueDate: "Ongoing", // Loans don't have fixed due dates in this contract
              status: "active",
              type: "usdt",
              ltv: currentLtv,
              accumulatedInterest: accumulatedInterest,
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

    // Check if collateral amount is greater than available balance
    if (parseFloat(collateralAmount) > availableBtcBalance) {
      toast.error("Insufficient lstBTC balance");
      return;
    }

    let approveToastId;
    let borrowToastId;

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
      approveToastId = toast.loading("Approving lstBTC transfer...");
      const approveTx = await btcToken.approve(
        LENDING_CONTRACT_ADDRESS,
        collateralInWei
      );
      await approveTx.wait();
      toast.dismiss(approveToastId);
      toast.success("lstBTC transfer approved!");

      // Step 2: Call depositAndBorrow function
      borrowToastId = toast.loading(
        `Depositing collateral and borrowing ${selectedStablecoin}...`
      );
      const isUSDT = selectedStablecoin === "USDT";

      const borrowTx = await lendingContract.depositAndBorrow(
        collateralInWei,
        loanAmountInWei,
        isUSDT
      );

      const receipt = await borrowTx.wait();
      toast.dismiss(borrowToastId);

      // Save transaction to profile storage
      const profileTransaction = {
        hash: receipt.transactionHash,
        reBtcUsed: parseFloat(collateralAmount),
        stablecoins: calculateLoanAmount(),
        currency: selectedStablecoin,
        status: "Active",
        type: "Collateralized Loan",
        description: `Borrowed ${calculateLoanAmount().toLocaleString()} ${selectedStablecoin} using ${collateralAmount} lstBTC as collateral`,
        userAddress: address,
        timestamp: new Date().toISOString(),
      };

      saveTransactionToProfile(profileTransaction);

      // Also try to use the global addTransaction function if available
      if (
        typeof window !== "undefined" &&
        typeof window.addTransaction === "function"
      ) {
        try {
          window.addTransaction(profileTransaction);
          console.log("Used global addTransaction function");
        } catch (error) {
          console.error("Error using global addTransaction function:", error);
        }
      }

      // Show custom success toast with transaction details
      showLoanSuccessToast(receipt, calculateLoanAmount(), selectedStablecoin);

      // Reset form and refresh loans
      setCollateralAmount("");
      fetchUserLoanPosition();
    } catch (error) {
      console.error("Borrow error:", error);

      // Dismiss any pending toasts
      if (approveToastId) toast.dismiss(approveToastId);
      if (borrowToastId) toast.dismiss(borrowToastId);

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
      } else if (error.message.includes("user rejected transaction")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(`Failed to borrow: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loan repayment success
  const handleRepaymentSuccess = (receipt) => {
    // Show success toast with transaction details
    const shortenedTxId = `${receipt.transactionHash.substring(
      0,
      6
    )}...${receipt.transactionHash.substring(62)}`;

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-[#2D333B] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                  ✓
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  Loan Repayment Successful!
                </p>
                <p className="mt-1 text-xs text-gray-300">
                  Your loan has been repaid and collateral released.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Transaction ID:{" "}
                  <span className="font-mono">{shortenedTxId}</span>
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${receipt.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  View on Etherscan
                </a>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-600">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );

    // Refresh loan positions
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

      {/* Add Toaster component */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#2D333B",
            color: "#fff",
            border: "1px solid #373E47",
          },
          success: {
            iconTheme: {
              primary: "#F7931A",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff4b4b",
              secondary: "#fff",
            },
          },
        }}
      />
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
                      {interestRate}% APR
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Origination Fee</p>
                    <p className="text-xl font-bold text-white">
                      {originationFee}% (
                      {(
                        (calculateLoanAmount() * originationFee) /
                        (100 - originationFee)
                      ).toFixed(2)}{" "}
                      {selectedStablecoin})
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
                    <th className="pb-4">Current LTV</th>
                    <th className="pb-4">Interest</th>
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
                        {loan.ltv.toFixed(2)}%
                      </td>
                      <td className="py-4 text-white">
                        {loan.interest}% + {loan.accumulatedInterest.toFixed(2)}{" "}
                        {loan.currency}
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
