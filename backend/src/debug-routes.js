// debug-routes.js
// Run this script to check all route handlers and identify undefined ones

const profileController = require("./controllers/profileController");
const loanController = require("./controllers/loanController");
const depositController = require("./controllers/depositController");
const stakeController = require("./controllers/stakeController");
const transactionController = require("./controllers/transactionController");

// Check if a controller method exists
function checkMethod(controller, methodName) {
  const exists = typeof controller[methodName] === "function";
  console.log(`${methodName}: ${exists ? "OK" : "UNDEFINED"}`);
  return exists;
}

console.log("\n=== Profile Controller Methods ===");
checkMethod(profileController, "getUserProfile");
checkMethod(profileController, "getUserDeposits");
checkMethod(profileController, "getYieldBreakdown");
checkMethod(profileController, "getActiveLoans");
checkMethod(profileController, "getTransactionHistory");
checkMethod(profileController, "getLstBtcDepositCount");
checkMethod(profileController, "updateLstBtcDepositCount");
checkMethod(profileController, "getActiveLoansCount");
checkMethod(profileController, "getDepositAssets");
checkMethod(profileController, "getRebtcRewards");

console.log("\n=== Loan Controller Methods ===");
checkMethod(loanController, "processFlashLoan");
checkMethod(loanController, "getActiveLoansCount");
checkMethod(loanController, "getLoanHistory");
checkMethod(loanController, "getLoanStats");

console.log("\n=== Deposit Controller Methods ===");
checkMethod(depositController, "processDeposit");
checkMethod(depositController, "getUserDeposits");
checkMethod(depositController, "getDepositStats");

console.log("\n=== Stake Controller Methods ===");
checkMethod(stakeController, "processStake");
checkMethod(stakeController, "processRewards");
checkMethod(stakeController, "getUserStakes");
checkMethod(stakeController, "getUserRewards");

console.log("\n=== Transaction Controller Methods ===");
checkMethod(transactionController, "recordTransaction");
checkMethod(transactionController, "getTransactionHistory");
checkMethod(transactionController, "getTransactionStats");

// Instructions
console.log("\n=== Instructions ===");
console.log("1. Run this script with: node debug-routes.js");
console.log("2. Look for any methods marked as UNDEFINED");
console.log("3. Implement those methods in their respective controllers");
console.log("4. Or provide fallback handlers in your route files");
