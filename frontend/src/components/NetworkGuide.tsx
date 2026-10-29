import React from "react";
import { MST_TESTNET_CONFIG, EXPLORER_BASE_URL } from "../config/mstNetwork";
import { useWallet } from "../context/WalletContext";
import { SECURE_CHAIN_CONTRACT_ADDRESS } from "../config/contractConfig";
import { shortenAddress } from "../utils/formatters";
import {
  Globe,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Terminal,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export const NetworkGuide: React.FC = () => {
  const { switchToMSTTestnet, isCorrectNetwork, chainId } = useWallet();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
          <Globe className="w-4 h-4" />
          <span>MST Blockchain Testnet Configuration</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          MST Network & Deployment Guide
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Reference parameters, one-click BridgeKey network configuration, and step-by-step deployment instructions for MST Blockchain BUILDATHON 2.0.
        </p>
      </div>

      {/* Network Parameters Table Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">MST Blockchain Testnet Parameters</h3>
            <p className="text-xs text-slate-400">
              Add this network to BridgeKey to sign on-chain logistics transactions
            </p>
          </div>
          <button
            onClick={switchToMSTTestnet}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-500/25 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add / Switch to MST in BridgeKey</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Network Name</span>
            <span className="font-semibold text-sm text-slate-100">{MST_TESTNET_CONFIG.chainName}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Chain ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-sky-400">{MST_TESTNET_CONFIG.chainId}</span>
              <span className="text-xs text-slate-500 font-mono">({MST_TESTNET_CONFIG.chainIdHex})</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">RPC Endpoint</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-200 truncate">{MST_TESTNET_CONFIG.rpcUrls[0]}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Currency Symbol</span>
            <span className="font-semibold text-sm text-emerald-400">{MST_TESTNET_CONFIG.nativeCurrency.symbol} (18 Decimals)</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 sm:col-span-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Block Explorer</span>
            <a
              href={EXPLORER_BASE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-sky-400 hover:underline flex items-center gap-1.5"
            >
              <span>{EXPLORER_BASE_URL}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Current Contract Status */}
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Contract Address</span>
            {SECURE_CHAIN_CONTRACT_ADDRESS ? (
              <span className="font-mono text-sky-400 font-semibold">{SECURE_CHAIN_CONTRACT_ADDRESS}</span>
            ) : (
              <span className="text-amber-400 font-medium">Not configured yet (Sandbox Demo Mode active)</span>
            )}
          </div>
          {SECURE_CHAIN_CONTRACT_ADDRESS && (
            <a
              href={`${EXPLORER_BASE_URL}/address/${SECURE_CHAIN_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Contract on Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Deployment & Terminal Walkthrough for Beginners */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Terminal className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-bold text-white">How to Deploy to MST Testnet (Beginner Guide)</h3>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          
          <div className="space-y-1.5">
            <span className="font-bold text-slate-100 block">Step 1: Get a Disposable Testnet Account</span>
            <p className="text-slate-400">
              In BridgeKey or your development wallet, create a separate testing account with no real mainnet assets. Export its private key and place it into a local <code className="bg-slate-950 px-2 py-0.5 rounded text-sky-300">.env</code> file:
            </p>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-sky-400 font-mono text-[11px] overflow-x-auto">
{`MST_RPC_URL=https://testnetrpc.mstblockchain.com
PRIVATE_KEY=your_disposable_testnet_private_key`}
            </pre>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-slate-100 block">Step 2: Fund with Testnet tMSTC</span>
            <p className="text-slate-400">
              Request testnet <code className="text-emerald-400">tMSTC</code> from the official MST Testnet faucet or community faucet to pay for contract deployment gas.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-slate-100 block">Step 3: Run the Deployment Script</span>
            <p className="text-slate-400">
              Execute the deployment script from your terminal:
            </p>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-sky-400 font-mono text-[11px] overflow-x-auto">
{`npm run deploy:testnet`}
            </pre>
            <p className="text-slate-400">
              The script will deploy <code className="text-sky-300">SecureChain.sol</code>, output the transaction hash and explorer link, and automatically update <code className="text-sky-300">frontend/src/config/contractConfig.ts</code>.
            </p>
          </div>

        </div>

        {/* Security Rules Banner */}
        <div className="p-4 bg-amber-950/40 border border-amber-800/50 rounded-2xl text-xs space-y-2 text-amber-300">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Critical Security Rules for Hackathons</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-amber-300/90 text-[11px]">
            <li><strong>Never share your wallet seed phrase or private key</strong> with anyone or in any chat.</li>
            <li>Never commit a <code className="bg-amber-950 px-1 rounded">.env</code> file or private keys to GitHub or public repositories.</li>
            <li>Always keep testnet developer keys strictly segregated from personal mainnet wallets.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
