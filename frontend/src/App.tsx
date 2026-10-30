import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { ShipmentList } from "./components/ShipmentList";
import { ShipmentDetail } from "./components/ShipmentDetail";
import { CreateShipmentModal } from "./components/CreateShipmentModal";
import { TransferCustodyModal } from "./components/TransferCustodyModal";
import { UpdateStatusModal } from "./components/UpdateStatusModal";
import { AddDocumentModal } from "./components/AddDocumentModal";
import { DocumentVerifier } from "./components/DocumentVerifier";
import { MSTLedger } from "./components/MSTLedger";
import { ImpactMetrics } from "./components/ImpactMetrics";
import { NetworkGuide } from "./components/NetworkGuide";
import { useWallet } from "./context/WalletContext";
import { ContractService } from "./services/contractService";
import { MST_MAINNET_CONFIG, MST_TESTNET_CONFIG } from "./config/mstNetwork";
import {
  Shipment,
  ShipmentStatus,
  CreateShipmentInput,
  MSTTransaction,
} from "./types/shipment";
import { shortenAddress, getExplorerTxUrl } from "./utils/formatters";
import {
  CheckCircle2,
  AlertCircle,
  Activity,
  Boxes,
  Zap,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";

export const AppContent: React.FC = () => {
  const { provider, signer, isDemoMode, account, chainId } = useWallet();

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [transactions, setTransactions] = useState<MSTTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected shipment for Detail view
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [transferModalShipment, setTransferModalShipment] = useState<Shipment | null>(null);
  const [statusModalShipment, setStatusModalShipment] = useState<Shipment | null>(null);
  const [addDocModalShipment, setAddDocModalShipment] = useState<Shipment | null>(null);

  // Document verifier pre-selection
  const [verifierTargetShipment, setVerifierTargetShipment] = useState<Shipment | null>(null);
  const [verifierTargetHash, setVerifierTargetHash] = useState<string | null>(null);

  // Transaction Broadcasting Simulation State
  const [broadcastingTx, setBroadcastingTx] = useState<{
    stage: "signing" | "mempool" | "confirmed";
    title: string;
    details: string;
    txHash?: string;
    blockNumber?: number;
  } | null>(null);

  // Toast Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
    txHash?: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string, txHash?: string) => {
    setNotification({ type, message, txHash });
    setTimeout(() => setNotification(null), 7000);
  };

  // Fetch all shipments and ledger transactions
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Never display Testnet or demo records on Mainnet.
      if (!isDemoMode && chainId === MST_MAINNET_CONFIG.chainId) {
        setShipments([]);
        setTransactions([]);
        setLoadError(
          "SecureChain Mainnet contract has not been deployed yet."
        );
        return;
      }

      // Do not silently fall back to the default Testnet RPC.
      if (!isDemoMode && !provider) {
        setShipments([]);
        setTransactions([]);
        setLoadError("Connect your wallet to load blockchain data.");
        return;
      }

      const data = await ContractService.getAllShipments(provider, isDemoMode);
      setShipments(data);
      setLoadError(null);
      const txs = ContractService.getTransactionLedger(isDemoMode);
      setTransactions(txs);

      // Keep selected shipment refreshed if open
      if (selectedShipment) {
        const updated = data.find((s) => s.trackingNumber === selectedShipment.trackingNumber);
        if (updated) setSelectedShipment(updated);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setShipments([]);
      setTransactions([]);
      setLoadError(err instanceof Error ? err.message : "Unable to load blockchain data.");
    } finally {
      setIsLoading(false);
    }
  }, [provider, isDemoMode, selectedShipment, chainId]);

  useEffect(() => {
    loadData();
  }, [provider, isDemoMode, chainId]);

  // Execute an action with simulated on-chain broadcast animation
  const executeWithBroadcasting = async (
    title: string,
    action: () => Promise<{ txHash: string; blockNumber: number }>
  ) => {
    setBroadcastingTx({
      stage: "signing",
      title,
      details: isDemoMode
        ? "Demo Mode: No wallet signature or blockchain transaction required."
        : "Authorizing cryptographic payload with BridgeKey...",
    });

    // Sub-second stage 1
    await new Promise((r) => setTimeout(r, 400));
    setBroadcastingTx({
      stage: "mempool",
      title,
      details: isDemoMode
          ? "Running in Demo Mode. No blockchain transaction will be submitted."
          : `Broadcasting transaction to ${chainId === MST_MAINNET_CONFIG.chainId ? MST_MAINNET_CONFIG.chainName : MST_TESTNET_CONFIG.chainName}...`,
    });

    // Sub-second finality
    const res = await action();
    await new Promise((r) => setTimeout(r, 500));

    setBroadcastingTx({
      stage: "confirmed",
      title,
      details: isDemoMode
        ? "Demo transaction completed. No on-chain transaction was submitted."
        : "Transaction confirmed on MST Blockchain.",
      txHash: res.txHash,
      blockNumber: res.blockNumber,
    });

    await loadData();
    setTimeout(() => setBroadcastingTx(null), 4000);
    return res;
  };

  // Handle Create Shipment
  const handleCreateShipment = async (input: CreateShipmentInput) => {
    try {
      await executeWithBroadcasting(`Registering ${input.trackingNumber}`, async () => {
        const res = await ContractService.createShipment(input, signer, isDemoMode);
        showNotification(
          "success",
          isDemoMode
            ? `Demo shipment ${input.trackingNumber} created successfully.`
            : `Consignment ${input.trackingNumber} registered on MST!`,
          res.txHash
        );
        return res;
      });
    } catch (err: any) {
      setBroadcastingTx(null);
      showNotification("error", "Failed to create shipment: " + err.message);
      throw err;
    }
  };

  // Handle Transfer Custody
  const handleTransferCustody = async (
    trackingNumber: string,
    newCustodian: string,
    location: string,
    note: string
  ) => {
    try {
      await executeWithBroadcasting(`Handing Over Custody for ${trackingNumber}`, async () => {
        const res = await ContractService.transferCustody(
          trackingNumber,
          newCustodian,
          location,
          note,
          signer,
          isDemoMode
        );
        showNotification("success", `Custody of ${trackingNumber} transferred on-chain!`, res.txHash);
        return res;
      });
    } catch (err: any) {
      setBroadcastingTx(null);
      showNotification("error", "Failed to transfer custody: " + err.message);
      throw err;
    }
  };

  // Handle Update Status
  const handleUpdateStatus = async (
    trackingNumber: string,
    status: ShipmentStatus,
    location: string,
    note: string
  ) => {
    try {
      await executeWithBroadcasting(`Updating Transit Status for ${trackingNumber}`, async () => {
        const res = await ContractService.updateStatus(
          trackingNumber,
          status,
          location,
          note,
          signer,
          isDemoMode
        );
        showNotification("success", `Milestone updated for ${trackingNumber} on MST!`, res.txHash);
        return res;
      });
    } catch (err: any) {
      setBroadcastingTx(null);
      showNotification("error", "Failed to update status: " + err.message);
      throw err;
    }
  };

  // Handle Add Document
  const handleAddDocument = async (
    trackingNumber: string,
    docHash: string,
    docType: string,
    docName: string
  ) => {
    try {
      await executeWithBroadcasting(`Anchoring Document Hash for ${trackingNumber}`, async () => {
        const res = await ContractService.addDocument(
          trackingNumber,
          docHash,
          docType,
          docName,
          signer,
          isDemoMode
        );
        showNotification("success", `Document hash for ${docName} anchored on-chain!`, res.txHash);
        return res;
      });
    } catch (err: any) {
      setBroadcastingTx(null);
      showNotification("error", "Failed to attach document: " + err.message);
      throw err;
    }
  };

  // Handle Enterprise Scale Simulation
  const handleSimulateEnterpriseScale = async () => {
    try {
      await executeWithBroadcasting("Simulating Global Enterprise Consignments", async () => {
        ContractService.simulateEnterpriseScale();
        await loadData();
        showNotification("success", "Injected 3 international enterprise consignments onto MST Ledger!");
        return { txHash: "0xsimulated_scale_batch_" + Date.now().toString(16), blockNumber: 6618955 };
      });
    } catch (err: any) {
      setBroadcastingTx(null);
      showNotification("error", "Simulation error: " + err.message);
    }
  };

  // Shortcut from ShipmentDetail into Document Verifier
  const handleOpenVerifierForDoc = (shipment: Shipment, docHash: string) => {
    setSelectedShipment(null);
    setVerifierTargetShipment(shipment);
    setVerifierTargetHash(docHash);
    setActiveTab("verifier");
  };

  // Shortcut from MST Ledger to open shipment detail
  const handleSelectShipmentByTracking = (trackingNumber: string) => {
    const s = shipments.find((item) => item.trackingNumber === trackingNumber);
    if (s) {
      setSelectedShipment(s);
    } else {
      setActiveTab("dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-sky-500 selection:text-white font-sans">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        shipmentCount={shipments.length}
        txCount={transactions.length}
      />

      {/* Network and data status */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-3">
        {isDemoMode ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            Demo Mode: Displayed shipment data and actions are simulated, not blockchain records.
          </div>
        ) : chainId === MST_MAINNET_CONFIG.chainId ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            MST Mainnet selected. SecureChain's Mainnet contract has not been deployed yet. Blockchain features are unavailable on Mainnet.
          </div>
        ) : chainId === MST_TESTNET_CONFIG.chainId ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
            Connected to MST Testnet.
          </div>
        ) : null}

        {loadError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
            Blockchain data unavailable: {loadError}
          </div>
        )}
      </div>

      {/* Broadcasting MST On-Chain Overlay Banner */}
      {broadcastingTx && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 border-2 border-sky-500/60 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-sky-400 font-mono">
                  MST Blockchain Transaction
                </span>
              </div>
              <button
                onClick={() => setBroadcastingTx(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">{broadcastingTx.title}</h4>
              <p className="text-xs text-slate-300">{broadcastingTx.details}</p>
            </div>

            {/* Stepper progress */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
              <div
                className={`p-2 rounded-xl text-center border ${
                  broadcastingTx.stage === "signing"
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                1. Sign
              </div>
              <div
                className={`p-2 rounded-xl text-center border ${
                  broadcastingTx.stage === "mempool"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                    : broadcastingTx.stage === "confirmed"
                    ? "bg-slate-950 text-emerald-400 border-slate-800"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                2. Broadcast
              </div>
              <div
                className={`p-2 rounded-xl text-center border ${
                  broadcastingTx.stage === "confirmed"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                3. Finalized (&lt;1s)
              </div>
            </div>

            {broadcastingTx.txHash && (
              <div className="pt-2 text-[11px] font-mono flex items-center justify-between text-slate-400">
                <span>Block #{broadcastingTx.blockNumber}</span>
                <a
                  href={getExplorerTxUrl(broadcastingTx.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>MSTScan Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-in">
          <div
            className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 text-xs ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/60 text-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="space-y-1">
              <span className="font-bold block text-sm">{notification.message}</span>
              {notification.txHash && (
                <span className="font-mono text-[10px] text-slate-300 block break-all">
                  Tx: {notification.txHash}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <ShipmentList
            shipments={shipments}
            isLoading={isLoading}
            onRefresh={loadData}
            onSelectShipment={(shipment) => setSelectedShipment(shipment)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSimulateEnterpriseScale={handleSimulateEnterpriseScale}
          />
        )}

        {activeTab === "verifier" && (
          <DocumentVerifier
            shipments={shipments}
            initialShipment={verifierTargetShipment}
            initialHash={verifierTargetHash}
          />
        )}

        {activeTab === "ledger" && (
          <MSTLedger
            transactions={transactions}
            onSelectShipmentByTracking={handleSelectShipmentByTracking}
          />
        )}

        {activeTab === "impact" && (
          <ImpactMetrics
            onSimulateEnterpriseScale={handleSimulateEnterpriseScale}
            shipmentCount={shipments.length}
          />
        )}

        {activeTab === "network" && <NetworkGuide />}
      </main>

      {/* Cohesive Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">SecureChain</span>
            <span className="text-slate-600">•</span>
            <span>MST Blockchain BUILDATHON 2.0</span>
            <span className="text-slate-600">•</span>
            <span>Decentralized Logistics Security Platform</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span>MST Chain ID: 91562037</span>
            <span className="text-slate-600">|</span>
            <span>Currency: tMSTC</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Finality &lt;0.8s</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateShipmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateShipment}
      />

      {selectedShipment && (
        <ShipmentDetail
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onOpenTransferModal={(s) => setTransferModalShipment(s)}
          onOpenStatusModal={(s) => setStatusModalShipment(s)}
          onOpenAddDocModal={(s) => setAddDocModalShipment(s)}
          onOpenVerifierForDoc={handleOpenVerifierForDoc}
        />
      )}

      <TransferCustodyModal
        shipment={transferModalShipment}
        isOpen={Boolean(transferModalShipment)}
        onClose={() => setTransferModalShipment(null)}
        onSubmit={handleTransferCustody}
      />

      <UpdateStatusModal
        shipment={statusModalShipment}
        isOpen={Boolean(statusModalShipment)}
        onClose={() => setStatusModalShipment(null)}
        onSubmit={handleUpdateStatus}
      />

      <AddDocumentModal
        shipment={addDocModalShipment}
        isOpen={Boolean(addDocModalShipment)}
        onClose={() => setAddDocModalShipment(null)}
        onSubmit={handleAddDocument}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
