import React, { useState } from "react";
import { Shipment, ShipmentStatus, STATUS_LABELS } from "../types/shipment";
import { useWallet } from "../context/WalletContext";
import { X, Truck, AlertCircle } from "lucide-react";

interface UpdateStatusModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trackingNumber: string, status: ShipmentStatus, location: string, note: string) => Promise<void>;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { account } = useWallet();
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus>(
    shipment ? Math.min(5, shipment.status + 1) : ShipmentStatus.InTransit
  );
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const isCallerRecipient =
    account && shipment.recipient.toLowerCase() === account.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!location.trim()) {
      setErrorMsg("Please provide current location");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(shipment.trackingNumber, selectedStatus, location.trim(), note.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update status");
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
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Update Shipment Status</h3>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status Display */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs flex justify-between items-center">
            <span className="text-slate-500">Current Status:</span>
            <span className="font-semibold text-sky-400">
              {STATUS_LABELS[shipment.status]}
            </span>
          </div>

          {/* Target Status Select */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              New Status <span className="text-sky-400">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(Number(e.target.value) as ShipmentStatus)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value={ShipmentStatus.PickedUp}>Picked Up</option>
              <option value={ShipmentStatus.InTransit}>In Transit</option>
              <option value={ShipmentStatus.OutForDelivery}>Out For Delivery</option>
              <option value={ShipmentStatus.Delivered}>Delivered (Confirm Receipt)</option>
              <option value={ShipmentStatus.Cancelled}>Cancelled</option>
            </select>
            {selectedStatus === ShipmentStatus.Delivered && (
              <p className="text-[10px] text-emerald-400 mt-1">
                Delivered status confirms final receipt and transfers terminal custody to the recipient.
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Current Milestone Location <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Frankfurt Distribution Center, Bay 14"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Milestone / Checkpoint Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Passed customs scanner. Scheduled for final mile dispatch."
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
              {isSubmitting ? "Updating Status..." : "Update On-Chain Status"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
