
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";
import {
  MST_TESTNET_CONFIG,
  MST_MAINNET_CONFIG,
} from "../config/mstNetwork";

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
  switchToMSTMainnet: () => Promise<void>;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoAccount: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

declare global {
  interface Window {
    ethereum?: any;
    bridgekey?: any;
  }
}

function getInjectedProvider(): any {
  if (typeof window === "undefined") return null;

  if (window.bridgekey) return window.bridgekey;

  const eth = window.ethereum;

  if (eth) {
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      const bridgeKeyProvider = eth.providers.find((p: any) => p.isBridgeKey);
      if (bridgeKeyProvider) return bridgeKeyProvider;
    }

    return eth;
  }

  return null;
}

function checkBridgeKeyStatus(): {
  isAvailable: boolean;
  isBridgeKeyFlag: boolean;
} {
  if (typeof window === "undefined") {
    return { isAvailable: false, isBridgeKeyFlag: false };
  }

  if (window.bridgekey) {
    return { isAvailable: true, isBridgeKeyFlag: true };
  }

  const eth = window.ethereum;

  if (!eth) {
    return { isAvailable: false, isBridgeKeyFlag: false };
  }

  if (eth.isBridgeKey) {
    return { isAvailable: true, isBridgeKeyFlag: true };
  }

  if (Array.isArray(eth.providers) && eth.providers.some((p: any) => p.isBridgeKey)) {
    return { isAvailable: true, isBridgeKeyFlag: true };
  }

  return { isAvailable: true, isBridgeKeyFlag: false };
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>("0.0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const {
    isAvailable: isWalletInstalled,
    isBridgeKeyFlag: isBridgeKeyDetected,
  } = checkBridgeKeyStatus();

  // Both MST networks are supported by the wallet context.
  const isCorrectNetwork =
    chainId === MST_TESTNET_CONFIG.chainId ||
    chainId === MST_MAINNET_CONFIG.chainId;

  const updateBalance = useCallback(
    async (currentProvider: BrowserProvider, currentAccount: string) => {
      try {
        const bal = await currentProvider.getBalance(currentAccount);
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      } catch (err) {
        console.warn("Could not fetch balance:", err);
        setBalance("0.0");
      }
    },
    []
  );

  useEffect(() => {
    const rawProvider = getInjectedProvider();
    if (!rawProvider) return;

    try {
      const browserProvider = new BrowserProvider(rawProvider);
      setProvider(browserProvider);

      browserProvider
        .getNetwork()
        .then((net) => setChainId(Number(net.chainId)))
        .catch(console.error);

      if (typeof rawProvider.request === "function") {
        rawProvider
          .request({ method: "eth_accounts" })
          .then(async (accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              const activeAcc = accounts[0];
              setAccount(activeAcc);

              const activeSigner = await browserProvider.getSigner();
              setSigner(activeSigner);

              updateBalance(browserProvider, activeAcc);
            }
          })
          .catch(console.error);
      }

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

      const handleChainChanged = async (newChainIdHex: string) => {
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

  const connectWallet = async () => {
    const rawProvider = getInjectedProvider();

    if (!rawProvider || typeof rawProvider.request !== "function") {
      alert(
        "BridgeKey wallet was not detected. Please install BridgeKey or open SecureChain in its dApp browser. You can also use Sandbox Demo."
      );
      return;
    }

    try {
      setIsConnecting(true);

      const browserProvider = new BrowserProvider(rawProvider);
      const accounts = await rawProvider.request({
        method: "eth_requestAccounts",
      });

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

        // Preserve either supported MST network.
        // Switch unsupported networks to Testnet by default.
        if (
          activeChainId !== MST_TESTNET_CONFIG.chainId &&
          activeChainId !== MST_MAINNET_CONFIG.chainId
        ) {
          await switchToMSTTestnet();
        }
      }
    } catch (error: any) {
      console.error("BridgeKey connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setBalance("0.0");
  };

  const switchToNetwork = async (
    networkConfig: typeof MST_TESTNET_CONFIG
  ) => {
    const rawProvider = getInjectedProvider();

    if (!rawProvider || typeof rawProvider.request !== "function") {
      alert("Please connect your BridgeKey wallet first.");
      return;
    }

    try {
      await rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkConfig.chainIdHex }],
      });
    } catch (switchError: any) {
      if (
        switchError.code === 4902 ||
        switchError?.data?.originalError?.code === 4902
      ) {
        try {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: networkConfig.chainIdHex,
                chainName: networkConfig.chainName,
                rpcUrls: networkConfig.rpcUrls,
                nativeCurrency: networkConfig.nativeCurrency,
                blockExplorerUrls: networkConfig.blockExplorerUrls,
              },
            ],
          });

          await rawProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: networkConfig.chainIdHex }],
          });
        } catch (addError) {
          console.error("Failed to add or switch network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const switchToMSTTestnet = async () => {
    await switchToNetwork(MST_TESTNET_CONFIG);
  };

  const switchToMSTMainnet = async () => {
    await switchToNetwork(MST_MAINNET_CONFIG);
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;

      if (next && !account) {
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
        switchToMSTMainnet,
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
