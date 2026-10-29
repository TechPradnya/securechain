// MST Blockchain Testnet Configuration
export const MST_TESTNET_CONFIG = {
  chainId: 91562037,
  chainIdHex: "0x5752315", // 91562037 in hex
  chainName: "MST Blockchain Testnet",
  rpcUrls: ["https://testnetrpc.mstblockchain.com"],
  nativeCurrency: {
    name: "Testnet MST Coin",
    symbol: "tMSTC",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.mstscan.com"],
};

export const DEFAULT_RPC_URL = "https://testnetrpc.mstblockchain.com";
export const EXPLORER_BASE_URL = "https://testnet.mstscan.com";
