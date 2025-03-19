import { http } from "viem";
const coreTestnet = {
  id: 1114,
  name: "Core Testnet",
  iconUrl: "https://miro.medium.com/v2/resize:fit:400/0*aRHYdVg5kllfc7Gn.jpg",
  nativeCurrency: {
    name: "Core Blockchain Testnet",
    symbol: "tCORE2",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.test2.btcs.network"] },
  },
  blockExplorers: {
    default: {
      name: "Core Testnet",
      url: "https://scan.test2.btcs.network",
    },
  },
};

export const chainArray = [coreTestnet];
export const transportsObject = {
  [coreTestnet.id]: http(),
};
