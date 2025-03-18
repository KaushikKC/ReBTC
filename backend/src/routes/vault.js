const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const { body, validationResult } = require("express-validator");
const {
  getProvider,
  getVaultContract,
  getBTCContract,
} = require("../services/services");

/**
 * @route POST /api/v1/vault/deposit
 * @desc Generate transaction data for depositing BTC into the yield vault
 * @access Public
 */
router.post(
  "/deposit",
  [
    body("userAddress")
      .isEthereumAddress()
      .withMessage("Valid Ethereum address is required"),
    body("amount").isString().withMessage("Amount must be a string"),
    body("gasPrice")
      .optional()
      .isString()
      .withMessage("Gas price must be a string"),
    body("gasLimit")
      .optional()
      .isString()
      .withMessage("Gas limit must be a string"),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userAddress, amount, gasPrice, gasLimit } = req.body;

      // Initialize provider and contracts
      const provider = getProvider();
      const vaultContract = getVaultContract();
      const btcContract = getBTCContract();

      // Get current nonce for the user
      const nonce = await provider.getTransactionCount(userAddress);

      // Create transaction data for approval (this is needed before deposit)
      const approvalTx = {
        to: btcContract.address,
        from: userAddress,
        nonce: ethers.utils.hexlify(nonce),
        gasPrice: gasPrice
          ? ethers.utils.parseUnits(gasPrice, "gwei")
          : await provider.getGasPrice(),
        gasLimit: gasLimit
          ? ethers.utils.hexlify(gasLimit)
          : ethers.utils.hexlify(100000), // Default gas limit
        data: btcContract.interface.encodeFunctionData("approve", [
          vaultContract.address,
          amount,
        ]),
      };

      // Create transaction data for deposit
      const depositTx = {
        to: vaultContract.address,
        from: userAddress,
        nonce: ethers.utils.hexlify(parseInt(nonce) + 1), // Increment nonce for the second transaction
        gasPrice: gasPrice
          ? ethers.utils.parseUnits(gasPrice, "gwei")
          : await provider.getGasPrice(),
        gasLimit: gasLimit
          ? ethers.utils.hexlify(gasLimit)
          : ethers.utils.hexlify(200000), // Default gas limit
        data: vaultContract.interface.encodeFunctionData("deposit", [amount]),
      };

      // Return both transactions
      return res.status(200).json({
        success: true,
        transactions: {
          approval: {
            ...approvalTx,
            gasPrice: ethers.utils.formatUnits(approvalTx.gasPrice, "gwei"),
            gasLimit: ethers.utils.formatUnits(approvalTx.gasLimit, "wei"),
          },
          deposit: {
            ...depositTx,
            gasPrice: ethers.utils.formatUnits(depositTx.gasPrice, "gwei"),
            gasLimit: ethers.utils.formatUnits(depositTx.gasLimit, "wei"),
          },
        },
        message:
          "Transaction data generated successfully. First approve the BTC transfer, then execute the deposit.",
      });
    } catch (error) {
      console.error("Error generating deposit transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating transaction data",
        error: error.message,
      });
    }
  }
);

module.exports = router;
