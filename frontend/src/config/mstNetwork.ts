
// MST Blockchain Testnet Configuration
export const MST_TESTNET_CONFIG = {
  chainId: 91562037,
  chainIdHex: "0x5752315",
  chainName: "MST Blockchain Testnet",
  rpcUrls: ["https://testnetrpc.mstblockchain.com"],
  nativeCurrency: {
    name: "Testnet MST Coin",
    symbol: "tMSTC",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.mstscan.com"],
};

// MST Blockchain Mainnet Configuration
export const MST_MAINNET_CONFIG = {
  chainId: 4646,
  chainIdHex: "0x1226",
  chainName: "MST Blockchain Mainnet",
  rpcUrls: ["https://mariorpc.mstblockchain.com"],
  nativeCurrency: {
    name: "MST Coin",
    symbol: "MSTC",
    decimals: 18,
  },
  blockExplorerUrls: ["https://mstscan.com"],
};

// Keep Testnet as the default
export const DEFAULT_RPC_URL = MST_TESTNET_CONFIG.rpcUrls[0];
export const EXPLORER_BASE_URL = MST_TESTNET_CONFIG.blockExplorerUrls[0];
