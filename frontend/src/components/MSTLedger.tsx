import React, { useState } from "react";
import { MSTTransaction } from "../types/shipment";
import { shortenAddress, formatTimestamp, getExplorerTxUrl } from "../utils/formatters";
import {
  Activity,
  ExternalLink,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Boxes,
  Fuel,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
} from "lucide-react";

interface MSTLedgerProps {
  transactions: MSTTransaction[];
  onSelectShipmentByTracking?: (trackingNumber: string) => void;
}

export const MSTLedger: React.FC<MSTLedgerProps> = ({
  transactions,
  onSelectShipmentByTracking,
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tx.hash.toLowerCase().includes(q) ||
      tx.trackingNumber.toLowerCase().includes(q) ||
      tx.details.toLowerCase().includes(q) ||
      tx.from.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterType !== "all" && tx.type !== filterType) return false;
    return true;
  });

  const getTypeBadge = (type: MSTTransaction["type"]) => {
    switch (type) {
      case "ShipmentCreated":
        return {
          label: "Consignment Genesis",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        };
      case "CustodyTransferred":
        return {
          label: "Custody Handover",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        };
      case "StatusUpdated":
        return {
          label: "Milestone Verified",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      case "DocumentAdded":
        return {
          label: "Doc Hash Anchored",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <Activity className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              <span>MST Blockchain Activity Stream</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              On-Chain Activity & Verification Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
              Every logistics milestone, custody change, and document hash is broadcast as an immutable EVM transaction on the MST Blockchain with sub-second finality.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg. Finality</span>
              <span className="text-lg font-mono font-extrabold text-emerald-400">&lt; 0.8s</span>
              <span className="text-[10px] text-slate-500 block">Sub-Second MST L1</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg. Gas Cost</span>
              <span className="text-lg font-mono font-extrabold text-sky-400">~0.00018</span>
              <span className="text-[10px] text-slate-500 block">tMSTC ($0.0001)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by Hash, Tracking ID, or address..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Event Types</option>
            <option value="ShipmentCreated">Consignment Genesis</option>
            <option value="CustodyTransferred">Custody Handover</option>
            <option value="StatusUpdated">Milestone Status</option>
            <option value="DocumentAdded">Document Anchored</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((tx) => {
            const badge = getTypeBadge(tx.type);
            return (
              <div
                key={tx.hash}
                className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Type, Details, and Tracking ID */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => onSelectShipmentByTracking?.(tx.trackingNumber)}
                      className="font-mono text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      {tx.trackingNumber}
                    </button>

                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>MST Finalized</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {tx.details}
                  </p>

                  {/* Hash & Participants */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500">Tx:</span>
                      <span className="text-slate-200">{shortenAddress(tx.hash, 6)}</span>
                      <button
                        onClick={() => handleCopy(tx.hash)}
                        className="text-slate-500 hover:text-slate-300 transition-colors ml-0.5"
                        title="Copy Tx Hash"
                      >
                        {copiedTx === tx.hash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Sender:</span>
                      <span className="text-slate-300">{shortenAddress(tx.from)}</span>
                    </div>

                    {tx.to && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>Recipient:</span>
                        <span className="text-slate-300">{shortenAddress(tx.to)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Block Height, Gas, Explorer Link */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 text-right gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                    <Boxes className="w-3.5 h-3.5 text-sky-400" />
                    <span>Block #{tx.blockNumber}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    <span>{tx.gasUsed}</span>
                  </div>

                  <a
                    href={getExplorerTxUrl(tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <span>Inspect on MSTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-12 bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-500 text-xs">
            No transactions match the current filter.
          </div>
        )}
      </div>

    </div>
  );
};
