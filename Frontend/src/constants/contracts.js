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
  "0x9f001D22425b8d4CFD95a4cFe86183D82F68C4fD";

export const USDC_TOKEN_ADDRESS = "0x14f58BeB7b9A25DF974c1BE245A7385B425337B3"; // USDC token address
export const USDT_TOKEN_ADDRESS = "0x0AC13581b7797E0c94d82966e6eF65654C193f5B"; // USDT token address
export const LOAN_RECEIVER_ADDRESS =
  "0x0c4ADecA0616F36dc542D55c0525C512313A6Ea2";
export const INSURANCE_POOL_ADDRESS =
  "0xC94f840066C6fa664CA96Dc8c8f499B77b7E57ad";

// Contract ABIs
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
  "function repayUSDC(uint256 amount) external",
  "function repayUSDT(uint256 amount) external",
  "function withdrawCollateral(uint256 amount) external",

  // Interest calculation
  "function updateInterest(address user) external",

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
