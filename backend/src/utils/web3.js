// utils/web3.js
import { ethers } from "ethers";

export const getProvider = () => {
  // Use environment variables to determine which provider to use
  if (process.env.NODE_ENV === "production") {
    return new ethers.providers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
  } else {
    return new ethers.providers.JsonRpcProvider(process.env.TESTNET_RPC_URL);
  }
};

export const getSigner = () => {
  const provider = getProvider();
  // Use private key from environment variables
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
};

// Helper function to convert wei to ether
export const weiToEther = (wei) => {
  return ethers.utils.formatEther(wei);
};

// Helper function to convert ether to wei
export const etherToWei = (ether) => {
  return ethers.utils.parseEther(ether);
};

// Helper function for USDT/USDC (6 decimal places)
export const formatStablecoin = (amount) => {
  return ethers.utils.formatUnits(amount, 6);
};

// Helper function for USDT/USDC (6 decimal places)
export const parseStablecoin = (amount) => {
  return ethers.utils.parseUnits(amount.toString(), 6);
};
