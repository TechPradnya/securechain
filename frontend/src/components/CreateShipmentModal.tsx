import React, { useState } from "react";
import { isAddress } from "ethers";
import { CreateShipmentInput } from "../types/shipment";
import { computeFileHash, FileHashResult, formatFileSize } from "../utils/cryptoHash";
import { generateTrackingNumber } from "../utils/formatters";
import { useWallet } from "../context/WalletContext";
import { X, Shield, Upload, FileText, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateShipmentInput) => Promise<void>;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { account } = useWallet();

  const [trackingNumber, setTrackingNumber] = useState(generateTrackingNumber());
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("High-Tech Electronics");
  const [docType, setDocType] = useState("Bill of Lading");

  const [fileHashResult, setFileHashResult] = useState<FileHashResult | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsHashing(true);
        setErrorMsg(null);
        const result = await computeFileHash(file);
        setFileHashResult(result);
      } catch (err: any) {
        setErrorMsg("Failed to compute file hash: " + err.message);
      } finally {
        setIsHashing(false);
      }
    }
  };

  const handleAutoGenerateTracking = () => {
    setTrackingNumber(generateTrackingNumber());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!trackingNumber.trim()) {
      setErrorMsg("Please enter a tracking number");
      return;
    }
    if (!recipient.trim() || !isAddress(recipient.trim())) {
      setErrorMsg("Please enter a valid Ethereum / MST recipient address");
      return;
    }
    if (account && recipient.toLowerCase() === account.toLowerCase()) {
      setErrorMsg("Recipient cannot be the same as your sender address");
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      setErrorMsg("Please specify both origin and destination");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        trackingNumber: trackingNumber.trim(),
        description: description.trim(),
        recipient: recipient.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        category,
        initialDocHash: fileHashResult?.keccak256Hash || "0x0000000000000000000000000000000000000000000000000000000000000000",
        docType: fileHashResult ? docType : "",
        docName: fileHashResult ? fileHashResult.fileName : "",
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register shipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Register New Shipment</h3>
              <p className="text-xs text-slate-400">
                Creates an immutable logistics record on the MST Blockchain
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

          {/* Tracking Number */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tracking Number <span className="text-sky-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SC-MST-2026-001"
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAutoGenerateTracking}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Description & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Consignment Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 50 Cartons of Surgical Equipment"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Industry Sector
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="High-Tech Electronics">High-Tech Electronics</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
                <option value="Aerospace Defense">Aerospace Defense</option>
                <option value="Luxury Goods">Luxury Goods</option>
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="General Freight">General Freight</option>
              </select>
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Designated Recipient Address (0x...) <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Only this recipient address (or current custodian) can mark the shipment as Delivered.
            </p>
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Origin Logistics Hub <span className="text-sky-400">*</span>
              </label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Singapore Freight Port"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Delivery Destination <span className="text-sky-400">*</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Frankfurt Central Cargo Hub"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Document Attachment & Instant Client-Side Hashing */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Initial Security Document (Optional)
              </label>
              <span className="text-[10px] text-sky-400 font-medium">
                Client-Side Cryptographic Hash
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2.5">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="col-span-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
              >
                <option value="Bill of Lading">Bill of Lading</option>
                <option value="Commercial Invoice">Commercial Invoice</option>
                <option value="Inspection Certificate">Inspection Certificate</option>
                <option value="Customs Declaration">Customs Declaration</option>
                <option value="Packing List">Packing List</option>
              </select>

              <div className="col-span-2 relative">
                <input
                  type="file"
                  id="doc-upload-initial"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="doc-upload-initial"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 hover:border-sky-500 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>{fileHashResult ? fileHashResult.fileName : "Select document to hash..."}</span>
                </label>
              </div>
            </div>

            {/* Hash Display Preview */}
            {fileHashResult && (
              <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Document Fingerprinted ({formatFileSize(fileHashResult.fileSize)})
                  </span>
                  <span className="text-[10px] text-slate-400">SHA-256 & Keccak-256</span>
                </div>
                <div className="font-mono text-[10px] text-slate-300 break-all bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Hash: </span>
                  {fileHashResult.keccak256Hash}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
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
              disabled={isSubmitting || isHashing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-xl shadow-md shadow-sky-400/20 transition-all"
            >
              {isSubmitting ? "Registering on MST..." : "Register Shipment on MST"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
