import React, { useState, useEffect } from "react";
import { Shipment, VerificationResult } from "../types/shipment";
import { computeFileHash, FileHashResult, formatFileSize } from "../utils/cryptoHash";
import { ContractService } from "../services/contractService";
import { shortenAddress, formatTimestamp, getExplorerAddressUrl } from "../utils/formatters";
import { useWallet } from "../context/WalletContext";
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface DocumentVerifierProps {
  shipments: Shipment[];
  initialShipment?: Shipment | null;
  initialHash?: string | null;
}

export const DocumentVerifier: React.FC<DocumentVerifierProps> = ({
  shipments,
  initialShipment,
  initialHash,
}) => {
  const { provider, isDemoMode } = useWallet();

  const [selectedTracking, setSelectedTracking] = useState<string>(
    initialShipment?.trackingNumber || (shipments.length > 0 ? shipments[0].trackingNumber : "")
  );

  const [fileHashResult, setFileHashResult] = useState<FileHashResult | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // Update selected tracking if initialShipment prop changes
  useEffect(() => {
    if (initialShipment) {
      setSelectedTracking(initialShipment.trackingNumber);
    }
  }, [initialShipment]);

  // Handle file selection and instant hashing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsHashing(true);
        setVerificationResult(null);
        setHasChecked(false);

        const result = await computeFileHash(file);
        setFileHashResult(result);

        // Automatically trigger verification once file is hashed
        await performVerification(selectedTracking, result.keccak256Hash);
      } catch (err) {
        console.error("Error hashing file:", err);
      } finally {
        setIsHashing(false);
      }
    }
  };

  const performVerification = async (tracking: string, hashToVerify: string) => {
    if (!tracking || !hashToVerify) return;

    try {
      setIsVerifying(true);
      const res = await ContractService.verifyDocument(tracking, hashToVerify, provider, isDemoMode);
      setVerificationResult(res);
      setHasChecked(true);
    } catch (err) {
      console.error("Verification query failed:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Demo helper: simulate authentic document
  const handleTestAuthentic = async () => {
    const currentShipment = shipments.find((s) => s.trackingNumber === selectedTracking);
    if (!currentShipment || !currentShipment.documents || currentShipment.documents.length === 0) {
      alert("No documents attached to this shipment yet to test authentic verification.");
      return;
    }

    const doc = currentShipment.documents[0];
    setFileHashResult({
      fileName: doc.documentName,
      fileSize: 245760,
      fileType: "application/pdf",
      sha256: doc.documentHash,
      keccak256Hash: doc.documentHash,
    });

    await performVerification(selectedTracking, doc.documentHash);
  };

  // Demo helper: simulate tampered document
  const handleTestTampered = async () => {
    const fakeHash = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678";
    setFileHashResult({
      fileName: "tampered_invoice_altered_amounts.pdf",
      fileSize: 251840,
      fileType: "application/pdf",
      sha256: fakeHash,
      keccak256Hash: fakeHash,
    });

    await performVerification(selectedTracking, fakeHash);
  };

  const currentShipment = shipments.find((s) => s.trackingNumber === selectedTracking);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Title & Explainer */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>MST On-Chain Cryptographic Integrity</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Document Integrity & Anti-Tampering Verifier
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Upload any bill of lading, customs declaration, or invoice. The browser computes its cryptographic hash client-side and validates it against the immutable record on the MST Blockchain.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Step 1: Select Shipment */}
        <div>
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Step 1: Select Target Shipment on MST
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedTracking}
              onChange={(e) => {
                setSelectedTracking(e.target.value);
                setVerificationResult(null);
                setHasChecked(false);
              }}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500"
            >
              {shipments.map((s) => (
                <option key={s.trackingNumber} value={s.trackingNumber}>
                  {s.trackingNumber} — {s.description || "Consignment"} ({s.documents?.length || 0} docs recorded)
                </option>
              ))}
            </select>

            {/* Quick Test Preset Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestAuthentic}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold rounded-xl transition-colors"
                title="Simulate testing an authentic, original document"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Authentic</span>
              </button>
              <button
                type="button"
                onClick={handleTestTampered}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-xl transition-colors"
                title="Simulate testing a file that has been modified/tampered"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Test Tampered</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Upload File for Verification */}
        <div>
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Step 2: Drop Document to Calculate Hash in Browser
          </label>

          <input
            type="file"
            id="verifier-file-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="verifier-file-input"
            className="flex flex-col items-center justify-center p-8 sm:p-10 bg-slate-950 hover:bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-sky-400 rounded-3xl cursor-pointer transition-all text-center group"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 mb-1">
              {fileHashResult ? fileHashResult.fileName : "Select or Drop Local Document File"}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Computes standard 256-bit cryptographic digest instantly. Your file never leaves your browser.
            </p>
          </label>
        </div>

        {/* Client-Side Hash Display */}
        {fileHashResult && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Local File Cryptographic Digest
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {fileHashResult.fileName} ({formatFileSize(fileHashResult.fileSize)})
              </span>
            </div>
            <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Keccak-256 Digest:</span>
              {fileHashResult.keccak256Hash}
            </div>
          </div>
        )}

        {/* Verification Result Output */}
        {isVerifying ? (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-sm text-sky-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Querying MST Blockchain smart contract...</span>
          </div>
        ) : hasChecked && verificationResult ? (
          verificationResult.isVerified ? (
            
            /* MATCH: 100% Authentic */
            <div className="p-6 bg-emerald-950/40 border-2 border-emerald-500/60 rounded-3xl space-y-4 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-emerald-400">
                    VERIFIED AUTHENTIC — 100% MATCH
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    The cryptographic digest of this file matches the tamper-proof on-chain fingerprint recorded on MST Blockchain.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-800/40 text-xs">
                <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
                  <span className="text-[10px] uppercase font-bold text-emerald-400/70 block">Document Type</span>
                  <span className="font-semibold text-emerald-100">{verificationResult.documentType}</span>
                </div>
                <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
                  <span className="text-[10px] uppercase font-bold text-emerald-400/70 block">On-Chain Recorded Name</span>
                  <span className="font-semibold text-emerald-100">{verificationResult.documentName}</span>
                </div>
                <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
                  <span className="text-[10px] uppercase font-bold text-emerald-400/70 block">Registered By</span>
                  <a
                    href={getExplorerAddressUrl(verificationResult.uploadedBy)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-300 hover:underline flex items-center gap-1"
                  >
                    <span>{shortenAddress(verificationResult.uploadedBy)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

          ) : (

            /* MISMATCH / TAMPERING DETECTED */
            <div className="p-6 bg-rose-950/40 border-2 border-rose-500/60 rounded-3xl space-y-3 shadow-lg shadow-rose-500/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-rose-400">
                    TAMPERING DETECTED / NO ON-CHAIN MATCH
                  </h3>
                  <p className="text-xs text-rose-200/80">
                    Warning: The cryptographic hash of the provided file does NOT match any document registered for shipment <span className="font-mono font-bold">{selectedTracking}</span> on the MST Blockchain.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-rose-950/80 border border-rose-800/40 rounded-xl text-[11px] text-rose-300">
                Possible causes: The document contents have been edited, signatures removed or altered, or this document belongs to a different consignment.
              </div>
            </div>

          )
        ) : null}

      </div>

      {/* Educational supply chain integrity callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">1</span>
            Deterministic Hashing
          </div>
          Every character in a document determines its hash. Changing a single letter or price flips the entire 256-bit hash.
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">2</span>
            MST Blockchain Anchoring
          </div>
          The document hash is stored inside an immutable Solidity smart contract on MST Testnet (Chain ID 91562037).
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">3</span>
            Zero Data Leakage
          </div>
          Confidential invoices and manifests stay on your computer. Only the cryptographic fingerprint is verified on-chain.
        </div>
      </div>

    </div>
  );
};
