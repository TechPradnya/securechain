import React, { useState } from "react";
import { Shipment } from "../types/shipment";
import { computeFileHash, FileHashResult, formatFileSize } from "../utils/cryptoHash";
import { X, FileText, Upload, CheckCircle2, AlertCircle } from "lucide-react";

interface AddDocumentModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trackingNumber: string, docHash: string, docType: string, docName: string) => Promise<void>;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [docType, setDocType] = useState("Customs Declaration");
  const [fileHashResult, setFileHashResult] = useState<FileHashResult | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsHashing(true);
        setErrorMsg(null);
        const result = await computeFileHash(file);
        setFileHashResult(result);
      } catch (err: any) {
        setErrorMsg("Failed to calculate document hash: " + err.message);
      } finally {
        setIsHashing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fileHashResult) {
      setErrorMsg("Please select a file to hash and attach");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(
        shipment.trackingNumber,
        fileHashResult.keccak256Hash,
        docType,
        fileHashResult.fileName
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to attach document hash");
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Attach Security Document</h3>
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

          {/* Document Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Document Category <span className="text-sky-400">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="Customs Declaration">Customs Declaration</option>
              <option value="Quality Inspection Certificate">Quality Inspection Certificate</option>
              <option value="Temperature Telemetry Report">Temperature Telemetry Report</option>
              <option value="Bill of Lading">Bill of Lading</option>
              <option value="Proof of Delivery">Proof of Delivery</option>
              <option value="Commercial Invoice">Commercial Invoice</option>
            </select>
          </div>

          {/* File Upload & Instant Browser Hashing */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Document File (PDF, Image, Text) <span className="text-sky-400">*</span>
            </label>
            
            <input
              type="file"
              id="modal-add-doc-file"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="modal-add-doc-file"
              className="flex flex-col items-center justify-center p-6 bg-slate-950 hover:bg-slate-800/70 border border-dashed border-slate-700 hover:border-sky-500 rounded-2xl cursor-pointer transition-colors text-center"
            >
              <Upload className="w-7 h-7 text-sky-400 mb-2" />
              <span className="text-xs font-medium text-slate-200">
                {fileHashResult ? fileHashResult.fileName : "Click or drag file to fingerprint"}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                Client-side Web Crypto API • File never leaves browser
              </span>
            </label>

            {/* Hash Display */}
            {fileHashResult && (
              <div className="mt-3 p-3 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hash Computed ({formatFileSize(fileHashResult.fileSize)})
                  </span>
                  <span className="text-[10px] text-slate-400">Keccak-256</span>
                </div>
                <div className="font-mono text-[10px] text-slate-300 break-all bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  {fileHashResult.keccak256Hash}
                </div>
              </div>
            )}
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
              disabled={isSubmitting || !fileHashResult || isHashing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-xl shadow-md shadow-sky-400/20 transition-all"
            >
              {isSubmitting ? "Submitting Hash..." : "Record Hash on MST"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
