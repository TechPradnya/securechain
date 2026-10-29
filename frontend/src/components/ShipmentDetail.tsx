import React, { useState } from "react";
import { Shipment, ShipmentStatus, STATUS_LABELS, STATUS_COLORS } from "../types/shipment";
import { shortenAddress, formatTimestamp, getExplorerAddressUrl, getExplorerTxUrl } from "../utils/formatters";
import { useWallet } from "../context/WalletContext";
import {
  X,
  Shield,
  ShieldCheck,
  User,
  MapPin,
  Clock,
  ArrowRight,
  FileText,
  History,
  ExternalLink,
  Copy,
  Check,
  Truck,
  ArrowLeftRight,
  PlusCircle,
  AlertTriangle,
} from "lucide-react";

interface ShipmentDetailProps {
  shipment: Shipment;
  onClose: () => void;
  onOpenTransferModal: (shipment: Shipment) => void;
  onOpenStatusModal: (shipment: Shipment) => void;
  onOpenAddDocModal: (shipment: Shipment) => void;
  onOpenVerifierForDoc?: (shipment: Shipment, docHash: string) => void;
}

export const ShipmentDetail: React.FC<ShipmentDetailProps> = ({
  shipment,
  onClose,
  onOpenTransferModal,
  onOpenStatusModal,
  onOpenAddDocModal,
  onOpenVerifierForDoc,
}) => {
  const { account } = useWallet();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const statusColor = STATUS_COLORS[shipment.status] || STATUS_COLORS[0];

  // Authorization checks
  const isCallerCustodian =
    account && shipment.currentCustodian.toLowerCase() === account.toLowerCase();
  const isCallerSender =
    account && shipment.sender.toLowerCase() === account.toLowerCase();
  const isCallerRecipient =
    account && shipment.recipient.toLowerCase() === account.toLowerCase();
  const canModify =
    isCallerCustodian || isCallerSender || (isCallerRecipient && shipment.status !== ShipmentStatus.Delivered);

  const isDeliveredOrCancelled =
    shipment.status === ShipmentStatus.Delivered ||
    shipment.status === ShipmentStatus.Cancelled;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Lifecycle steps for progress indicator
  const steps = [
    { label: "Created", status: ShipmentStatus.Created },
    { label: "Picked Up", status: ShipmentStatus.PickedUp },
    { label: "In Transit", status: ShipmentStatus.InTransit },
    { label: "Out For Delivery", status: ShipmentStatus.OutForDelivery },
    { label: "Delivered", status: ShipmentStatus.Delivered },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white">
                  {shipment.trackingNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                  {STATUS_LABELS[shipment.status]}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created on {formatTimestamp(shipment.createdAt)} • Last updated {formatTimestamp(shipment.updatedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Authorization Alert Banner */}
          {account && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                isCallerCustodian
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : isCallerRecipient
                  ? "bg-sky-950/40 border-sky-800/60 text-sky-300"
                  : "bg-slate-950/60 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
                <span>
                  {isCallerCustodian
                    ? "✓ Your wallet is the Current Custodian. You have authorized permissions to transfer custody and update transit status."
                    : isCallerRecipient
                    ? "✓ You are the Designated Recipient. You have permission to confirm receipt upon delivery."
                    : "ℹ️ Read-Only View: Modifications are restricted to the active custodian, sender, or recipient."}
                </span>
              </div>
            </div>
          )}

          {/* Stepper Progress Bar */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">
              Consignment Progress
            </h4>
            <div className="relative flex items-center justify-between">
              
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-800 -z-0" />
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500 -z-0"
                style={{
                  width: `${Math.min(100, Math.max(0, (shipment.status / 4) * 100))}%`,
                }}
              />

              {steps.map((step, idx) => {
                const isPassed = shipment.status >= step.status;
                const isCurrent = shipment.status === step.status;

                return (
                  <div key={step.label} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        isCurrent
                          ? "bg-sky-500 text-white border-sky-300 shadow-md shadow-sky-500/40 scale-110"
                          : isPassed
                          ? "bg-emerald-500 text-white border-emerald-400"
                          : "bg-slate-900 text-slate-500 border-slate-700"
                      }`}
                    >
                      {isPassed && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-[11px] font-medium hidden sm:block ${
                        isCurrent ? "text-sky-300 font-bold" : isPassed ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description & Route Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cargo Description */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Cargo Description
              </span>
              <p className="text-sm font-semibold text-slate-100">
                {shipment.description || "General Freight Consignment"}
              </p>
            </div>

            {/* Route */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Logistics Transit Route
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="truncate">{shipment.origin}</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{shipment.destination}</span>
              </div>
            </div>

          </div>

          {/* On-Chain Addresses */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
              On-Chain Identity & Participants
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Sender (Originator)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-slate-200 font-medium">
                    {shortenAddress(shipment.sender)}
                  </span>
                  <a
                    href={getExplorerAddressUrl(shipment.sender)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-sky-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Current Custodian</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sky-400 font-semibold">
                    {shortenAddress(shipment.currentCustodian)}
                  </span>
                  <a
                    href={getExplorerAddressUrl(shipment.currentCustodian)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-sky-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Recipient</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-slate-200 font-medium">
                    {shortenAddress(shipment.recipient)}
                  </span>
                  <a
                    href={getExplorerAddressUrl(shipment.recipient)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-sky-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Custody Chain History */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                  Immutable Custody Chain ({shipment.custodyHistory?.length || 1} records)
                </h4>
              </div>
            </div>

            <div className="space-y-4">
              {shipment.custodyHistory && shipment.custodyHistory.length > 0 ? (
                shipment.custodyHistory.map((record, index) => (
                  <div key={index} className="relative flex items-start gap-4">
                    {index !== shipment.custodyHistory!.length - 1 && (
                      <div className="absolute left-3 top-7 bottom-0 w-0.5 bg-slate-800" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center text-xs shrink-0 mt-0.5 z-10">
                      {index + 1}
                    </div>
                    <div className="flex-1 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-200">
                            {shortenAddress(record.custodian)}
                          </span>
                          {record.role && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {record.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formatTimestamp(record.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sky-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{record.location}</span>
                      </div>

                      {record.note && (
                        <p className="text-slate-400 text-[11px] italic">"{record.note}"</p>
                      )}

                      {(record.txHash || record.blockNumber) && (
                        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                          {record.blockNumber && <span>MST Block #{record.blockNumber}</span>}
                          {record.txHash && (
                            <a
                              href={getExplorerTxUrl(record.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                            >
                              <span>Tx: {shortenAddress(record.txHash, 4)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No custody handover history available.</p>
              )}
            </div>
          </div>

          {/* Document Hashes & Integrity Registry */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                  Tamper-Proof Document Registry ({shipment.documents?.length || 0})
                </h4>
              </div>
              {canModify && !isDeliveredOrCancelled && (
                <button
                  onClick={() => onOpenAddDocModal(shipment)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {shipment.documents && shipment.documents.length > 0 ? (
                shipment.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{doc.documentName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {doc.documentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span>Hash:</span>
                        <span className="text-slate-300 font-mono">
                          {doc.documentHash.substring(0, 18)}...{doc.documentHash.substring(doc.documentHash.length - 8)}
                        </span>
                        <button
                          onClick={() => handleCopy(doc.documentHash)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title="Copy Full Hash"
                        >
                          {copiedHash === doc.documentHash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Uploaded by {shortenAddress(doc.uploadedBy)} on {formatTimestamp(doc.timestamp)}
                      </div>
                    </div>

                    {onOpenVerifierForDoc && (
                      <button
                        onClick={() => onOpenVerifierForDoc(shipment, doc.documentHash)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Verify File</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500">
                  No documents attached yet to this shipment.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {isDeliveredOrCancelled ? (
              <span className="text-amber-400">Shipment is completed. Further status edits are locked.</span>
            ) : canModify ? (
              <span className="text-emerald-400">You are authorized to execute actions on this shipment.</span>
            ) : (
              <span>Connect an authorized wallet address to perform actions.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canModify && !isDeliveredOrCancelled && (
              <>
                <button
                  onClick={() => onOpenStatusModal(shipment)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Update Status</span>
                </button>
                <button
                  onClick={() => onOpenTransferModal(shipment)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all shadow-md shadow-sky-400/20"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Transfer Custody</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
