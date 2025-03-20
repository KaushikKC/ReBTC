// Contract addresses
export const DEPOSIT_CONTRACT_ADDRESS =
  "0x922F892557e4CBa52d78dBaE8199cE4836A4cF94";
export const BTC_TOKEN_ADDRESS = "0x579721ACfFeDD19dC61685d496E68ee346aA100a";
export const WBTC_TOKEN_ADDRESS = "0x789..."; // Replace with actual WBTC token address
export const WETH_TOKEN_ADDRESS = "0x9e42e9D0f548314415833C5F3d69C95774E6c395";
export const LSTBTC_TOKEN_ADDRESS =
  "0x9F384C8dA02CBFA67CE9b3BDddED49c7bB327dc9";
// Contract addresses
export const LENDING_CONTRACT_ADDRESS =
  "0x0878fAF7697Ba41B88C1E76CF4BC19A589403C3a";
export const INSURANCE_CONTRACT_ADDRESS =
  "0xC94f840066C6fa664CA96Dc8c8f499B77b7E57ad"; // Replace with actual insurance contract address
export const FLASH_LOAN_CONTRACT_ADDRESS =
  "0x19079b097C72e5A2520Ee4fA8Ef1B9f9DDd75Fcf"; // Flash loan contract address

export const USDC_TOKEN_ADDRESS = "0x14f58BeB7b9A25DF974c1BE245A7385B425337B3"; // USDC token address
export const USDT_TOKEN_ADDRESS = "0x0AC13581b7797E0c94d82966e6eF65654C193f5B"; // USDT token address
export const LOAN_RECEIVER_ADDRESS =
  "0x0c4ADecA0616F36dc542D55c0525C512313A6Ea2";
export const INSURANCE_POOL_ADDRESS =
  "0xC94f840066C6fa664CA96Dc8c8f499B77b7E57ad";

// Add this to your existing contract addresses
export const FAUCET_CONTRACT_ADDRESS =
  "0x6E3f2C97B4Ab1c45AA324fD69A8028EE8a6055Ae"; // Faucet contract address

// Add this to your existing contract ABIs
export const FAUCET_CONTRACT_ABI = [
  // View functions
  "function getTokenBalance(address token) external view returns (uint256)",
  "function getLastRequestTime(address user, address token) external view returns (uint256)",
  "function getDailyLimit(address token) external view returns (uint256)",
  "function getRequestsRemaining(address user, address token) external view returns (uint256)",
  "function cooldownPeriod() external view returns (uint256)",
  "function requestAmounts(address token) external view returns (uint256)",

  // State-changing functions
  "function requestBTC() external",
  "function requestlstBTC() external",
  "function requestUSDC() external",
  "function requestUSDT() external",

  // Admin functions
  "function setDailyLimit(address token, uint256 limit) external",
  "function setRequestAmount(address token, uint256 amount) external",
  "function setCooldownPeriod(uint256 period) external",
  "function withdrawTokens(address token, uint256 amount) external",

  // Events
  "event TokensRequested(address indexed user, address indexed token, uint256 amount)",
  "event DailyLimitUpdated(address indexed token, uint256 newLimit)",
  "event RequestAmountUpdated(address indexed token, uint256 newAmount)",
  "event CooldownPeriodUpdated(uint256 newPeriod)",
];

// Contract ABIs
export const FLASH_LOAN_CONTRACT_ABI = [
  // Token addresses
  "function lstBtcToken() external view returns (address)",
  "function usdtToken() external view returns (address)",
  "function usdcToken() external view returns (address)",
  "function insurancePool() external view returns (address)",

  // View functions
  "function feePercentage() external view returns (uint256)",
  "function totalFeesCollected() external view returns (uint256)",
  "function getAvailableStablecoinLiquidity(bool useUsdt) external view returns (uint256)",

  // State-changing functions
  "function exchangeLstBtcForStablecoin(uint256 lstBtcAmount, bool useUsdt) external",
  "function addStablecoinLiquidity(uint256 amount, bool useUsdt) external",

  // Admin functions
  "function withdrawStablecoin(uint256 amount, bool useUsdt) external",
  "function updateInsurancePoolAddress(address _insurancePoolAddress) external",
  "function updateFeePercentage(uint256 _feePercentage) external",
  "function recoverToken(address tokenAddress, uint256 amount) external",

  // Events
  "event Exchange(address indexed user, uint256 lstBtcAmount, uint256 stablecoinAmount, address stablecoinUsed)",
  "event StablecoinLiquidityAdded(address indexed provider, uint256 amount, address stablecoinUsed)",
  "event FeesWithdrawn(address indexed recipient, uint256 amount)",
  "event InsurancePoolFunded(uint256 amount)",
];

export const INSURANCE_CONTRACT_ABI = [
  // View functions
  "function policies(uint256 _policyId) external view returns (address policyholder, uint256 coverageAmount, uint256 premium, uint256 startTimestamp, uint256 expirationTimestamp, uint8 status, bool claimed, uint8 coverageType)",
  "function policyCount() external view returns (uint256)",
  "function poolBalance() external view returns (uint256)",
  "function getTotalActiveCoverage() external view returns (uint256)",
  "function getPolicyStatus(uint256 _policyId) external view returns (uint8)",
  "function getUserPolicies(address _user) external view returns (uint256[])",

  // State-changing functions
  "function applyForInsurance(uint256 _coverageAmount, uint8 _coverageType, uint256 _durationDays) external returns (uint256)",
  "function claimInsurance(uint256 _policyId, uint256 _claimAmount) external",
  "function cancelPolicy(uint256 _policyId) external",

  // Events
  "event PolicyCreated(uint256 indexed policyId, address indexed policyholder, uint256 coverageAmount, uint256 premium, uint256 expirationTimestamp, uint8 coverageType)",
  "event ClaimPaid(uint256 indexed policyId, address indexed policyholder, uint256 amount)",
  "event PolicyStatusChanged(uint256 indexed policyId, uint8 status)",
  "event PolicyCancelled(uint256 indexed policyId, address indexed policyholder)",
];

export const LENDING_CONTRACT_ABI = [
  // View functions
  "function getBtcPrice() external view returns (uint256)",
  "function getUserLoanCount(address user) external view returns (uint256)",
  "function getUserLoanIdAtIndex(address user, uint256 index) external view returns (uint256)",
  "function loans(uint256 loanId) external view returns (address borrower, uint256 collateralAmount, uint256 loanAmount, address stablecoin, uint256 interestRate, uint256 dueDate, bool repaid, bool liquidated)",
  "function calculateRepaymentAmount(uint256 loanId) external view returns (uint256)",
  "function getLiquidationPrice(uint256 loanId) external view returns (uint256)",
  "function loanPositions(address user) external view returns (uint256 collateralAmount, uint256 borrowedUSDC, uint256 borrowedUSDT, uint256 lastInterestCalcTimestamp)",
  "function getTotalDebt(address user) external view returns (uint256)",
  "function getCollateralValue(uint256 collateralAmount) external view returns (uint256)",

  // Collateral and borrowing functions
  "function depositCollateral(uint256 amount) external",
  "function borrow(bool isUSDT, uint256 amount) external",
  "function depositAndBorrow(uint256 collateralAmount, uint256 borrowAmount, bool isUSDT) external",
  "function repay(bool isUSDT, uint256 amount) external",
  "function withdrawCollateral(uint256 amount) external",

  // Interest calculation
  "function updateInterest(address user) external",

  "function LTV_RATIO() external view returns (uint256)",
  "function ORIGINATION_FEE() external view returns (uint256)",
  "function getInterestRate() external view returns (uint256)",

  // State-changing functions from original ABI
  "function createLoan(uint256 collateralAmount, uint256 loanAmount, address stablecoin, uint256 interestRateBps) external returns (uint256)",
  "function repayLoan(uint256 loanId) external",
  "function liquidateLoan(uint256 loanId) external",
  "function extendLoanDuration(uint256 loanId, uint256 additionalDays) external",

  // Events
  "event CollateralDeposited(address indexed user, uint256 amount)",
  "event CollateralWithdrawn(address indexed user, uint256 amount)",
  "event LoanTaken(address indexed borrower, address stablecoin, uint256 amount)",
  "event LoanRepaid(address indexed borrower, address stablecoin, uint256 amount)",
  "event LoanLiquidated(address indexed borrower, uint256 collateralAmount, uint256 debtAmount)",

  // Events from original ABI
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 collateralAmount, uint256 loanAmount, address stablecoin, uint256 interestRate, uint256 dueDate)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 repaymentAmount)",
  "event LoanLiquidated(uint256 indexed loanId, address indexed borrower, uint256 collateralAmount, uint256 loanAmount)",
  "event LoanExtended(uint256 indexed loanId, uint256 newDueDate)",
];

// Token ABI (ERC20)
export const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
];

// Deposit Contract ABI
export const DEPOSIT_CONTRACT_ABI = [
  // User deposit functions
  "function depositBTC(uint256 amount) external",
  "function depositWETH(uint256 amount) external",

  // User withdrawal functions
  "function withdrawBTC(uint256 amount) external",
  "function withdrawBTCFast(uint256 amount) external",
  "function withdrawWETH(uint256 amount) external",
  "function withdrawWETHFast(uint256 amount) external",

  // User deposit info
  "function userBtcDeposits(address user) external view returns (uint256 amount, uint256 depositTimestamp)",
  "function userWethDeposits(address user) external view returns (uint256 amount, uint256 depositTimestamp)",

  // Total value locked
  "function btcTotalDeposited() external view returns (uint256)",
  "function btcTotalValueLocked() external view returns (uint256)",
  "function wethTotalDeposited() external view returns (uint256)",
  "function wethTotalValueLocked() external view returns (uint256)",

  // Earnings
  "function calculateEarnings(address user) external view returns (uint256)",
  "function reinvestEarnings() external",

  // Events
  "event DepositBTC(address indexed user, uint256 amount, uint256 lstBTCAmount)",
  "event DepositWETH(address indexed user, uint256 amount, uint256 lstWETHAmount)",
  "event WithdrawBTC(address indexed user, uint256 amount)",
  "event WithdrawWETH(address indexed user, uint256 amount)",
];

// Crypto options for dropdown selection
export const cryptoOptions = [
  { id: "btc", name: "BTC", tokenAddress: BTC_TOKEN_ADDRESS, decimals: 8 },
  { id: "wbtc", name: "wBTC", tokenAddress: WBTC_TOKEN_ADDRESS, decimals: 8 },
  { id: "weth", name: "WETH", tokenAddress: WETH_TOKEN_ADDRESS, decimals: 18 },
  {
    id: "lstbtc",
    name: "lstBTC",
    tokenAddress: LSTBTC_TOKEN_ADDRESS,
    decimals: 18,
  },
];
