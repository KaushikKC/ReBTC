const ethers = require("ethers");
const BTCYieldVaultABI = require("../abis/BTCYieldVault.json");
const MockBTCABI = require("../abis/MockBTC.json");
const config = require("../config/config");

/**
 * Get Ethereum provider based on configuration
 */
function getProvider() {
  // Check if custom RPC URL is provided
  const rpcUrl = process.env.RPC_URL;

  if (rpcUrl) {
    // Use custom RPC URL if provided
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  // Use environment variable to determine which network to connect to
  const network = process.env.ETHEREUM_NETWORK || "localhost";

  if (network === "localhost") {
    // Connect to local node (Hardhat, Ganache, etc.)
    return new ethers.providers.JsonRpcProvider("http://localhost:8545");
  } else {
    // Connect to Infura or other provider for testnet/mainnet
    const infuraKey = process.env.INFURA_API_KEY;
    if (infuraKey) {
      return new ethers.providers.InfuraProvider(network, infuraKey);
    } else {
      throw new Error(
        "Either RPC_URL or INFURA_API_KEY must be provided for non-localhost networks"
      );
    }
  }
}

/**
 * Get the BTCYieldVault contract instance
 */
function getVaultContract() {
  const provider = getProvider();
  return new ethers.Contract(
    config.contracts.BTCYieldVault,
    BTCYieldVaultABI,
    provider
  );
}

/**
 * Get the MockBTC contract instance
 */
function getBTCContract() {
  const provider = getProvider();
  return new ethers.Contract(config.contracts.MockBTC, MockBTCABI, provider);
}

/**
 * Get the lstBTC contract instance
 */
function getLstBTCContract() {
  const provider = getProvider();
  const vaultContract = getVaultContract();

  // This is async but we're returning a promise that will resolve to the contract
  return vaultContract.lstBTCToken().then((lstBTCAddress) => {
    return new ethers.Contract(
      lstBTCAddress,
      // Using a generic ERC20 ABI for lstBTC
      [
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
      ],
      provider
    );
  });
}

module.exports = {
  getProvider,
  getVaultContract,
  getBTCContract,
  getLstBTCContract,
};
