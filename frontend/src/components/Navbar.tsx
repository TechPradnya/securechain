
import React from "react";
import { useWallet } from "../context/WalletContext";
import { shortenAddress } from "../utils/formatters";
import { MST_TESTNET_CONFIG, MST_MAINNET_CONFIG } from "../config/mstNetwork";
import {
  Shield,
  Wallet,
  AlertCircle,
  RefreshCw,
  Cpu,
  Activity,
  Globe2,
  FileCheck,
  Package,
  Layers,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  shipmentCount?: number;
  txCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  shipmentCount = 0,
  txCount = 0,
}) => {
  const {
    account,
    chainId,
    isCorrectNetwork,
    balance,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToMSTTestnet,
    isDemoMode,
    toggleDemoMode,
  } = useWallet();

  const isMainnet = chainId === MST_MAINNET_CONFIG.chainId;
  const isTestnet = chainId === MST_TESTNET_CONFIG.chainId;

  const networkName = isMainnet
    ? "MST Mainnet"
    : isTestnet
      ? "MST Testnet"
      : "Unsupported Network";

  const currencySymbol = isMainnet ? "MSTC" : "tMSTC";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Logo & Platform Name */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25 ring-1 ring-sky-400/30">
              <Shield className="w-5 h-5 drop-shadow" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping opacity-75" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  Secure
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                    Chain
                  </span>
                </span>

                <span className="hidden sm:inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full">
                  MST Blockchain L1
                </span>
              </div>

              <p className="text-[11px] text-slate-400 hidden xl:block font-medium">
                Logistics Security & On-Chain Shipment Verification
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 shadow-inner">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Shipments</span>

              {shipmentCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === "dashboard"
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {shipmentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("verifier")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "verifier"
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Document Verifier</span>
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all relative ${
                activeTab === "ledger"
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>MST Live Ledger</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-0.5" />
            </button>

            <button
              onClick={() => setActiveTab("impact")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "impact"
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Impact & Scalability</span>
            </button>

            <button
              onClick={() => setActiveTab("network")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "network"
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Network & BridgeKey</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Sandbox Simulation Mode Toggle */}
            <button
              onClick={toggleDemoMode}
              title="Toggle Sandbox Mode for instant offline simulation"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                isDemoMode
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10"
                  : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Cpu
                className={`w-3.5 h-3.5 ${
                  isDemoMode ? "text-amber-400 animate-pulse" : "text-slate-500"
                }`}
              />
              <span className="hidden sm:inline">
                {isDemoMode ? "Sandbox Demo: ON" : "Sandbox: OFF"}
              </span>
            </button>

            {/* Dynamic MST Network Status Badge */}
            {account && (
              <div className="hidden sm:flex items-center">
                {isCorrectNetwork ? (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${
                      isMainnet
                        ? "bg-sky-950/60 text-sky-400 border-sky-800/60"
                        : "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        isMainnet ? "bg-sky-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="font-mono">{networkName}</span>
                  </div>
                ) : (
                  <button
                    onClick={switchToMSTTestnet}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-medium hover:bg-amber-900/60 transition-all"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Switch to MST Testnet</span>
                  </button>
                )}
              </div>
            )}

            {/* Wallet Button */}
            {account ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1 pr-2">
                <div className="px-2.5 py-1 text-xs font-mono font-bold text-sky-400 bg-sky-950/50 rounded-lg border border-sky-800/30">
                  {balance} {currencySymbol}
                </div>

                <div className="text-xs font-mono text-slate-200 font-semibold px-1">
                  {shortenAddress(account)}
                </div>

                <button
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-sky-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>
                  {isConnecting ? "Connecting..." : "Connect BridgeKey"}
                </span>
              </button>
            )}

            {/* Quick Register Action Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 rounded-xl transition-all shadow-md shadow-sky-400/20 transform hover:-translate-y-0.5"
            >
              <span>+ Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
            activeTab === "dashboard"
              ? "bg-sky-500 text-white font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Shipments ({shipmentCount})
        </button>

        <button
          onClick={() => setActiveTab("verifier")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
            activeTab === "verifier"
              ? "bg-sky-500 text-white font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Verifier
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
            activeTab === "ledger"
              ? "bg-sky-500 text-white font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          MST Ledger
        </button>

        <button
          onClick={() => setActiveTab("impact")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
            activeTab === "impact"
              ? "bg-sky-500 text-white font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Impact & Scale
        </button>

        <button
          onClick={() => setActiveTab("network")}
          className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
            activeTab === "network"
              ? "bg-sky-500 text-white font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Network
        </button>
      </div>
    </header>
  );
};
