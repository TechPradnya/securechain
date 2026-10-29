import React, { useState } from "react";
import { isAddress } from "ethers";
import { Shipment } from "../types/shipment";
import { shortenAddress } from "../utils/formatters";
import { useWallet } from "../context/WalletContext";
import { X, ArrowLeftRight, AlertCircle, ShieldAlert } from "lucide-react";

interface TransferCustodyModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trackingNumber: string, newCustodian: string, location: string, note: string) => Promise<void>;
}

export const TransferCustodyModal: React.FC<TransferCustodyModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { account } = useWallet();
  const [newCustodian, setNewCustodian] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const isCurrentCustodian =
    account && shipment.currentCustodian.toLowerCase() === account.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newCustodian.trim() || !isAddress(newCustodian.trim())) {
      setErrorMsg("Please enter a valid Ethereum / MST address for the new custodian");
      return;
    }
    if (newCustodian.toLowerCase() === shipment.currentCustodian.toLowerCase()) {
      setErrorMsg("New custodian must be different from current custodian");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Please provide the handover location");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(shipment.trackingNumber, newCustodian.trim(), location.trim(), note.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to transfer custody");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Transfer Shipment Custody</h3>
              <p className="text-xs text-slate-400 font-mono">
                {shipment.trackingNumber}
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

        {/* Warning if caller is not current custodian */}
        {!isCurrentCustodian && (
          <div className="m-6 mb-0 p-3 bg-amber-950/50 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold block">Authorization Warning</span>
              The connected wallet is not the active custodian ({shortenAddress(shipment.currentCustodian)}). The on-chain smart contract will revert unless signed by the custodian.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Custodian Display */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs flex justify-between items-center">
            <span className="text-slate-500">Current Custodian:</span>
            <span className="font-mono text-slate-200 font-semibold">
              {shortenAddress(shipment.currentCustodian)}
            </span>
          </div>

          {/* New Custodian Address */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              New Custodian Address (0x...) <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newCustodian}
              onChange={(e) => setNewCustodian(e.target.value)}
              placeholder="e.g. 0xCarrierAddress..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Handover Location <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dubai Air Freight Terminal 2"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Custody Transfer Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Transferred to Air Cargo Carrier. All container seals intact."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-xl shadow-md shadow-sky-400/20 transition-all"
            >
              {isSubmitting ? "Signing Handover..." : "Confirm Custody Handover"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
