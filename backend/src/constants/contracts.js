// constants/contracts.js
// This file contains all the contract addresses and ABIs used in the application

// Contract Addresses
const BTC_TOKEN_ADDRESS =
  process.env.BTC_TOKEN_ADDRESS || "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6";
const LSTBTC_TOKEN_ADDRESS =
  process.env.LSTBTC_TOKEN_ADDRESS ||
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const REBTC_TOKEN_ADDRESS =
  process.env.REBTC_TOKEN_ADDRESS ||
  "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811";
const DEPOSIT_CONTRACT_ADDRESS =
  process.env.DEPOSIT_CONTRACT_ADDRESS ||
  "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
const STAKING_CONTRACT_ADDRESS =
  process.env.STAKING_CONTRACT_ADDRESS ||
  "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
const FLASH_LOAN_CONTRACT_ADDRESS =
  process.env.FLASH_LOAN_CONTRACT_ADDRESS ||
  "0x398eC7346DcD622eDc5ae82352F02bE94C62d119";
const LOAN_CONTRACT_ADDRESS =
  process.env.LOAN_CONTRACT_ADDRESS ||
  "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8";
const INSURANCE_CONTRACT_ADDRESS =
  process.env.INSURANCE_CONTRACT_ADDRESS ||
  "0x9424B1412450D0f8Fc2255FAf6046b98213B76Bd";

// Standard ERC20 Token ABI (minimal version for common functions)
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

// Deposit Contract ABI
const DEPOSIT_CONTRACT_ABI = [
  "function deposit(uint256 amount) external returns (bool)",
  "function withdraw(uint256 amount) external returns (bool)",
  "function getDepositBalance(address user) external view returns (uint256)",
  "function getAPY() external view returns (uint256)",
  "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdrawal(address indexed user, uint256 amount, uint256 timestamp)",
];

// Staking Contract ABI
const STAKING_CONTRACT_ABI = [
  "function stake(uint256 amount) external returns (bool)",
  "function unstake(uint256 amount) external returns (bool)",
  "function getStakedBalance(address user) external view returns (uint256)",
  "function getRewards(address user) external view returns (uint256)",
  "function claimRewards() external returns (uint256)",
  "event Staked(address indexed user, uint256 amount, uint256 timestamp)",
  "event Unstaked(address indexed user, uint256 amount, uint256 timestamp)",
  "event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp)",
];

// Flash Loan Contract ABI
const FLASH_LOAN_CONTRACT_ABI = [
  "function flashLoan(address recipient, address token, uint256 amount, bytes calldata data) external returns (bool)",
  "function getFlashLoanFee() external view returns (uint256)",
  "event FlashLoan(address indexed recipient, address indexed token, uint256 amount, uint256 fee, uint256 timestamp)",
];

// Loan Contract ABI
const LOAN_CONTRACT_ABI = [
  "function borrow(uint256 amount, address collateralToken, uint256 collateralAmount) external returns (uint256)",
  "function repay(uint256 loanId) external returns (bool)",
  "function getLoan(uint256 loanId) external view returns (address borrower, uint256 amount, uint256 collateralAmount, uint256 interestRate, uint256 dueDate, bool repaid)",
  "function getUserLoans(address user) external view returns (uint256[])",
  "function getUserActiveLoanAmount(address user) external view returns (uint256)",
  "function hasInsurance(address user) external view returns (bool)",
  "event LoanCreated(address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 collateralAmount, uint256 dueDate)",
  "event LoanRepaid(address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 interest)",
];

// Insurance Contract ABI
const INSURANCE_CONTRACT_ABI = [
  "function purchaseInsurance(uint256 coverageAmount, uint8 coverageType, uint256 duration) external returns (uint256)",
  "function claimInsurance(uint256 policyId, uint256 claimAmount) external returns (bool)",
  "function getPolicies(address policyholder) external view returns (uint256[])",
  "function policies(uint256 policyId) external view returns (address policyholder, uint256 coverageAmount, uint256 premium, uint256 startTimestamp, uint256 expirationTimestamp, uint8 status, bool claimed)",
  "function getUserPolicies(address user) external view returns (uint256[])",
  "function poolBalance() external view returns (uint256)",
  "function getTotalActiveCoverage() external view returns (uint256)",
  "function policyCount() external view returns (uint256)",
  "event PolicyPurchased(address indexed policyholder, uint256 indexed policyId, uint256 coverageAmount, uint8 coverageType, uint256 premium, uint256 duration)",
  "event ClaimPaid(address indexed policyholder, uint256 indexed policyId, uint256 amount)",
];

module.exports = {
  BTC_TOKEN_ADDRESS,
  LSTBTC_TOKEN_ADDRESS,
  REBTC_TOKEN_ADDRESS,
  DEPOSIT_CONTRACT_ADDRESS,
  STAKING_CONTRACT_ADDRESS,
  FLASH_LOAN_CONTRACT_ADDRESS,
  LOAN_CONTRACT_ADDRESS,
  INSURANCE_CONTRACT_ADDRESS,
  TOKEN_ABI,
  DEPOSIT_CONTRACT_ABI,
  STAKING_CONTRACT_ABI,
  FLASH_LOAN_CONTRACT_ABI,
  LOAN_CONTRACT_ABI,
  INSURANCE_CONTRACT_ABI,
};
