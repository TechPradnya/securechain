export enum ShipmentStatus {
  Created = 0,
  PickedUp = 1,
  InTransit = 2,
  OutForDelivery = 3,
  Delivered = 4,
  Cancelled = 5,
}

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  [ShipmentStatus.Created]: "Created",
  [ShipmentStatus.PickedUp]: "Picked Up",
  [ShipmentStatus.InTransit]: "In Transit",
  [ShipmentStatus.OutForDelivery]: "Out For Delivery",
  [ShipmentStatus.Delivered]: "Delivered",
  [ShipmentStatus.Cancelled]: "Cancelled",
};

export const STATUS_COLORS: Record<
  ShipmentStatus,
  { bg: string; text: string; border: string; dot: string; glow: string }
> = {
  [ShipmentStatus.Created]: {
    bg: "bg-blue-950/60",
    text: "text-blue-400",
    border: "border-blue-800/60",
    dot: "bg-blue-400",
    glow: "shadow-blue-500/20",
  },
  [ShipmentStatus.PickedUp]: {
    bg: "bg-cyan-950/60",
    text: "text-cyan-400",
    border: "border-cyan-800/60",
    dot: "bg-cyan-400",
    glow: "shadow-cyan-500/20",
  },
  [ShipmentStatus.InTransit]: {
    bg: "bg-amber-950/60",
    text: "text-amber-400",
    border: "border-amber-800/60",
    dot: "bg-amber-400",
    glow: "shadow-amber-500/20",
  },
  [ShipmentStatus.OutForDelivery]: {
    bg: "bg-purple-950/60",
    text: "text-purple-400",
    border: "border-purple-800/60",
    dot: "bg-purple-400",
    glow: "shadow-purple-500/20",
  },
  [ShipmentStatus.Delivered]: {
    bg: "bg-emerald-950/60",
    text: "text-emerald-400",
    border: "border-emerald-800/60",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  [ShipmentStatus.Cancelled]: {
    bg: "bg-rose-950/60",
    text: "text-rose-400",
    border: "border-rose-800/60",
    dot: "bg-rose-400",
    glow: "shadow-rose-500/20",
  },
};

export interface CustodyRecord {
  custodian: string;
  timestamp: number;
  location: string;
  note: string;
  role?: string;
  txHash?: string;
  blockNumber?: number;
}

export interface DocumentRecord {
  documentHash: string;
  documentType: string;
  documentName: string;
  uploadedBy: string;
  timestamp: number;
  txHash?: string;
  fileSizeBytes?: number;
}

export interface Shipment {
  trackingNumber: string;
  description: string;
  sender: string;
  recipient: string;
  currentCustodian: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  createdAt: number;
  updatedAt: number;
  exists: boolean;
  category?: string;
  estimatedArrival?: number;
  custodyHistory?: CustodyRecord[];
  documents?: DocumentRecord[];
}

export interface CreateShipmentInput {
  trackingNumber: string;
  description: string;
  recipient: string;
  origin: string;
  destination: string;
  initialDocHash: string;
  docType: string;
  docName: string;
  category?: string;
}

export interface VerificationResult {
  isVerified: boolean;
  documentType: string;
  documentName: string;
  uploadedBy: string;
  timestamp: number;
  blockNumber?: number;
  txHash?: string;
}

export interface MSTTransaction {
  hash: string;
  type: "ShipmentCreated" | "CustodyTransferred" | "StatusUpdated" | "DocumentAdded";
  trackingNumber: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to?: string;
  gasUsed: string;
  details: string;
  status: "confirmed" | "broadcasting";
}
