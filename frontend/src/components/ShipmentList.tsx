import React, { useState, useMemo } from "react";
import { Shipment, ShipmentStatus, STATUS_LABELS } from "../types/shipment";
import { ShipmentCard } from "./ShipmentCard";
import { useWallet } from "../context/WalletContext";
import {
  Search,
  Filter,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  FileCheck,
  Plus,
  Sparkles,
  ArrowUpDown,
  Layers,
  X,
} from "lucide-react";

interface ShipmentListProps {
  shipments: Shipment[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectShipment: (shipment: Shipment) => void;
  onOpenCreateModal: () => void;
  onSimulateEnterpriseScale?: () => void;
}

export const ShipmentList: React.FC<ShipmentListProps> = ({
  shipments,
  isLoading,
  onRefresh,
  onSelectShipment,
  onOpenCreateModal,
  onSimulateEnterpriseScale,
}) => {
  const { account } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [onlyMyShipments, setOnlyMyShipments] = useState(false);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter(
      (s) => s.status === ShipmentStatus.InTransit || s.status === ShipmentStatus.PickedUp
    ).length;
    const delivered = shipments.filter((s) => s.status === ShipmentStatus.Delivered).length;
    const totalDocs = shipments.reduce((acc, s) => acc + (s.documents?.length || 0), 0);
    return { total, inTransit, delivered, totalDocs };
  }, [shipments]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    shipments.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [shipments]);

  // Filtering
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.trackingNumber.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.sender.toLowerCase().includes(q) ||
        s.recipient.toLowerCase().includes(q) ||
        s.currentCustodian.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      // Status filter
      if (statusFilter !== "all") {
        const numericStatus = parseInt(statusFilter, 10);
        if (s.status !== numericStatus) return false;
      }

      // Category filter
      if (categoryFilter !== "all") {
        if (s.category !== categoryFilter) return false;
      }

      // My shipments filter
      if (onlyMyShipments && account) {
        const acc = account.toLowerCase();
        const isMine =
          s.sender.toLowerCase() === acc ||
          s.recipient.toLowerCase() === acc ||
          s.currentCustodian.toLowerCase() === acc;
        if (!isMine) return false;
      }

      return true;
    });
  }, [shipments, searchQuery, statusFilter, categoryFilter, onlyMyShipments, account]);

  return (
    <div className="space-y-6">
      
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Registered</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">On-chain consignments</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">In Transit</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">{stats.inTransit}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Active carrier handovers</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Delivered & Verified</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{stats.delivered}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Terminal custody verified</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Document Hashes</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-400 font-mono">{stats.totalDocs}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Anchored on MST L1</div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm shadow-xl">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tracking ID, address, cargo, or logistics hub..."
              className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value={String(ShipmentStatus.Created)}>Created</option>
              <option value={String(ShipmentStatus.PickedUp)}>Picked Up</option>
              <option value={String(ShipmentStatus.InTransit)}>In Transit</option>
              <option value={String(ShipmentStatus.OutForDelivery)}>Out For Delivery</option>
              <option value={String(ShipmentStatus.Delivered)}>Delivered</option>
              <option value={String(ShipmentStatus.Cancelled)}>Cancelled</option>
            </select>

            {/* Category Dropdown */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Industries</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* My Shipments Pill */}
            {account && (
              <button
                onClick={() => setOnlyMyShipments(!onlyMyShipments)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                  onlyMyShipments
                    ? "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm shadow-sky-500/10"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                My Shipments
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh on-chain state"
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-400" : ""}`} />
            </button>

            {/* Simulate Enterprise Scale Quick Button */}
            {onSimulateEnterpriseScale && (
              <button
                onClick={onSimulateEnterpriseScale}
                title="Batch inject global enterprise consignments to showcase scalability"
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate Scale</span>
              </button>
            )}

            {/* Register New Shipment */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 rounded-xl transition-all shrink-0 shadow-md shadow-sky-400/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Shipment</span>
            </button>

          </div>

        </div>
      </div>

      {/* Shipment Cards Grid */}
      {filteredShipments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShipments.map((shipment) => (
            <ShipmentCard
              key={shipment.trackingNumber}
              shipment={shipment}
              onSelect={onSelectShipment}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-14 bg-slate-900/40 border border-slate-800 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200 mb-1">No matching shipments</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "No consignments match your selected filters. Clear your filters or query to view all records."
                : "Register a consignment to start tracking its custody history and document hashes on the MST Blockchain."}
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Shipment</span>
          </button>
        </div>
      )}

    </div>
  );
};
