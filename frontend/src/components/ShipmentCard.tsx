import React from "react";
import { Shipment, STATUS_LABELS, STATUS_COLORS } from "../types/shipment";
import { shortenAddress, formatTimestamp } from "../utils/formatters";
import { MapPin, ArrowRight, User, FileText, History, ShieldCheck, Tag } from "lucide-react";

interface ShipmentCardProps {
  shipment: Shipment;
  onSelect: (shipment: Shipment) => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, onSelect }) => {
  const statusColor = STATUS_COLORS[shipment.status] || STATUS_COLORS[0];
  const docCount = shipment.documents?.length || 0;
  const custodyCount = shipment.custodyHistory?.length || 1;

  return (
    <div
      onClick={() => onSelect(shipment)}
      className="group relative flex flex-col justify-between bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-sky-500/50 rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 backdrop-blur-sm"
    >
      <div>
        {/* Top Header: Tracking Number, Category & Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-sky-400 group-hover:text-cyan-300 transition-colors">
                {shipment.trackingNumber}
              </span>
              {shipment.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {shipment.category}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Registered {formatTimestamp(shipment.createdAt)}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border} shadow-sm shrink-0`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} animate-pulse`} />
            {STATUS_LABELS[shipment.status]}
          </span>
        </div>

        {/* Cargo Description */}
        <h3 className="text-sm font-bold text-slate-100 group-hover:text-white line-clamp-1 mb-4 leading-snug">
          {shipment.description || "Logistics Consignment"}
        </h3>

        {/* Origin -> Destination Route Graphic */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 mb-4 group-hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex-1 truncate">
              <span className="text-[9px] uppercase font-extrabold text-slate-500 block tracking-wider">Origin Hub</span>
              <span className="font-semibold text-slate-200 truncate block mt-0.5">{shipment.origin}</span>
            </div>
            
            <div className="flex flex-col items-center shrink-0 px-2">
              <span className="text-[9px] text-sky-400/80 font-mono font-medium">MST Route</span>
              <ArrowRight className="w-4 h-4 text-sky-400 my-0.5" />
            </div>

            <div className="flex-1 text-right truncate">
              <span className="text-[9px] uppercase font-extrabold text-slate-500 block tracking-wider">Destination</span>
              <span className="font-semibold text-slate-200 truncate block mt-0.5">{shipment.destination}</span>
            </div>
          </div>
        </div>

        {/* Current Custodian */}
        <div className="flex items-center justify-between text-xs mb-3 px-1">
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Active Custodian:
          </span>
          <span className="font-mono text-slate-300 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
            {shortenAddress(shipment.currentCustodian)}
          </span>
        </div>
      </div>

      {/* Footer Badges & Action */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-300 font-medium" title="Anchored Security Documents">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>{docCount} {docCount === 1 ? "doc" : "docs"}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-300 font-medium" title="Immutable Custody Handovers">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>{custodyCount} {custodyCount === 1 ? "hop" : "hops"}</span>
          </span>
        </div>

        <span className="text-xs font-bold text-sky-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
          <span>Inspect</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </span>
      </div>
    </div>
  );
};
