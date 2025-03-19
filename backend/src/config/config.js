/**
 * Application configuration
 */
const config = {
  // Contract addresses - update these with your deployed contract addresses
  contracts: {
    BTCYieldVault: process.env.BTC_YIELD_VAULT_ADDRESS || "0x123...", // Replace with actual address
    MockBTC: process.env.MOCK_BTC_ADDRESS || "0x456...", // Replace with actual address
    BTCCollateralizedLending: process.env.BTC_LENDING_ADDRESS || "0x789...", // Replace with actual address
    MockUSDT: process.env.MOCK_USDT_ADDRESS || "0xabc...", // Replace with actual address
    MockUSDC: process.env.MOCK_USDC_ADDRESS || "0xdef...", // Replace with actual address
  },

  // API settings
  api: {
    port: process.env.PORT || 3000,
    prefix: "/api/v1",
  },

  // Gas setting
  gas: {
    defaultGasLimit: 2000000,
    defaultGasPrice: 20, // in gwei
  },
};

module.exports = config;
