import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";
import { MST_TESTNET_CONFIG } from "../config/mstNetwork";

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  balance: string;
  isConnecting: boolean;
  isWalletInstalled: boolean;
  isBridgeKeyDetected: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToMSTTestnet: () => Promise<void>;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoAccount: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Extend Window interface for Ethereum & BridgeKey
declare global {
  interface Window {
    ethereum?: any;
    bridgekey?: any;
  }
}

/**
 * Safely resolves the injected Web3 provider, prioritizing BridgeKey
 */
function getInjectedProvider(): any {
  if (typeof window === "undefined") return null;

  // 1. Direct BridgeKey injection
  if (window.bridgekey) {
    return window.bridgekey;
  }

  const eth = window.ethereum;
  if (eth) {
    // 2. Multi-provider array (e.g., multiple extensions installed)
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      const bridgeKeyProvider = eth.providers.find((p: any) => p.isBridgeKey);
      if (bridgeKeyProvider) return bridgeKeyProvider;
    }
    // 3. Injected Ethereum provider (BridgeKey extension or in-app browser)
    return eth;
  }

  return null;
}

/**
 * Checks whether BridgeKey or a compatible EIP-1193 provider is available
 */
function checkBridgeKeyStatus(): { isAvailable: boolean; isBridgeKeyFlag: boolean } {
  if (typeof window === "undefined") return { isAvailable: false, isBridgeKeyFlag: false };
  if (window.bridgekey) return { isAvailable: true, isBridgeKeyFlag: true };

  const eth = window.ethereum;
  if (!eth) return { isAvailable: false, isBridgeKeyFlag: false };
  if (eth.isBridgeKey) return { isAvailable: true, isBridgeKeyFlag: true };
  if (Array.isArray(eth.providers) && eth.providers.some((p: any) => p.isBridgeKey)) {
    return { isAvailable: true, isBridgeKeyFlag: true };
  }

  return { isAvailable: true, isBridgeKeyFlag: false };
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>("0.0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const { isAvailable: isWalletInstalled, isBridgeKeyFlag: isBridgeKeyDetected } = checkBridgeKeyStatus();
  const isCorrectNetwork = chainId === MST_TESTNET_CONFIG.chainId;

  // Update balance when account or chainId changes
  const updateBalance = useCallback(async (currentProvider: BrowserProvider, currentAccount: string) => {
    try {
      const bal = await currentProvider.getBalance(currentAccount);
      const formatted = parseFloat(formatEther(bal)).toFixed(4);
      setBalance(formatted);
    } catch (err) {
      console.warn("Could not fetch balance:", err);
      setBalance("0.0");
    }
  }, []);

  // Initialize provider and inspect active network
  useEffect(() => {
    const rawProvider = getInjectedProvider();
    if (!rawProvider) return;

    try {
      const browserProvider = new BrowserProvider(rawProvider);
      setProvider(browserProvider);

      browserProvider.getNetwork().then((net) => {
        setChainId(Number(net.chainId));
      }).catch(console.error);

      // Check if already authorized
      if (typeof rawProvider.request === "function") {
        rawProvider.request({ method: "eth_accounts" }).then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            const activeAcc = accounts[0];
            setAccount(activeAcc);
            const activeSigner = await browserProvider.getSigner();
            setSigner(activeSigner);
            updateBalance(browserProvider, activeAcc);
          }
        }).catch(console.error);
      }

      // Event listeners for account and network changes
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
          setBalance("0.0");
        } else {
          setAccount(accounts[0]);
          const newSigner = await browserProvider.getSigner();
          setSigner(newSigner);
          updateBalance(browserProvider, accounts[0]);
        }
      };

      const handleChainChanged = (newChainIdHex: string) => {
        const numericChainId = parseInt(newChainIdHex, 16);
        setChainId(numericChainId);
        const newProvider = new BrowserProvider(rawProvider);
        setProvider(newProvider);
        if (account) {
          updateBalance(newProvider, account);
        }
      };

      if (rawProvider.on) {
        rawProvider.on("accountsChanged", handleAccountsChanged);
        rawProvider.on("chainChanged", handleChainChanged);
      }

      return () => {
        if (rawProvider.removeListener) {
          rawProvider.removeListener("accountsChanged", handleAccountsChanged);
          rawProvider.removeListener("chainChanged", handleChainChanged);
        }
      };
    } catch (err) {
      console.error("Provider initialization error:", err);
    }
  }, [account, updateBalance]);

  // Connect BridgeKey Wallet
  const connectWallet = async () => {
    const rawProvider = getInjectedProvider();
    if (!rawProvider || typeof rawProvider.request !== "function") {
      alert(
        "BridgeKey wallet was not detected.\n\nPlease ensure the BridgeKey browser extension is installed, or open SecureChain within the BridgeKey mobile app dApp browser.\n\nYou can also click 'Sandbox Demo' in the top bar to test the dashboard immediately."
      );
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(rawProvider);
      const accounts = await rawProvider.request({ method: "eth_requestAccounts" });

      if (accounts && accounts.length > 0) {
        const activeAcc = accounts[0];
        setAccount(activeAcc);
        setProvider(browserProvider);
        const activeSigner = await browserProvider.getSigner();
        setSigner(activeSigner);

        const network = await browserProvider.getNetwork();
        const activeChainId = Number(network.chainId);
        setChainId(activeChainId);

        await updateBalance(browserProvider, activeAcc);

        // If not on MST Testnet, prompt to switch
        if (activeChainId !== MST_TESTNET_CONFIG.chainId) {
          await switchToMSTTestnet();
        }
      }
    } catch (error: any) {
      console.error("User rejected or failed BridgeKey connection:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setBalance("0.0");
  };

  // Switch or Add MST Blockchain Testnet to BridgeKey
  const switchToMSTTestnet = async () => {
    const rawProvider = getInjectedProvider();
    if (!rawProvider || typeof rawProvider.request !== "function") return;

    try {
      // Prompt chain switch
      await rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MST_TESTNET_CONFIG.chainIdHex }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates chain not yet added
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MST_TESTNET_CONFIG.chainIdHex,
                chainName: MST_TESTNET_CONFIG.chainName,
                rpcUrls: MST_TESTNET_CONFIG.rpcUrls,
                nativeCurrency: MST_TESTNET_CONFIG.nativeCurrency,
                blockExplorerUrls: MST_TESTNET_CONFIG.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add MST Testnet to BridgeKey:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      if (next && !account) {
        // Simulated authorized account for demo exploration
        setAccount("0x71C83605655767b43aBe74D9063d8102a9009893");
        setBalance("25.0000");
        setChainId(MST_TESTNET_CONFIG.chainId);
      }
      return next;
    });
  };

  const setDemoAccount = (address: string) => {
    setAccount(address);
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isCorrectNetwork,
        balance,
        isConnecting,
        isWalletInstalled,
        isBridgeKeyDetected,
        provider,
        signer,
        connectWallet,
        disconnectWallet,
        switchToMSTTestnet,
        isDemoMode,
        toggleDemoMode,
        setDemoAccount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
