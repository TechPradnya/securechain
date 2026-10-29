import { Contract, JsonRpcSigner, BrowserProvider, JsonRpcProvider } from "ethers";
import { SECURE_CHAIN_ABI, SECURE_CHAIN_CONTRACT_ADDRESS } from "../config/contractConfig";
import { DEFAULT_RPC_URL } from "../config/mstNetwork";
import {
  Shipment,
  ShipmentStatus,
  CustodyRecord,
  DocumentRecord,
  CreateShipmentInput,
  VerificationResult,
  MSTTransaction,
} from "../types/shipment";

// Starting MST testnet block counter for realistic simulation
let currentSimulatedBlock = 6618950;

function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Initial Live MST Activity Ledger
const INITIAL_TRANSACTIONS: MSTTransaction[] = [
  {
    hash: "0x4b7e2891d6c810fb837a281093847291a823901b2c48e9102834719283746102",
    type: "DocumentAdded",
    trackingNumber: "SC-MST-2026-ALPHA",
    blockNumber: 6618949,
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 4,
    from: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    gasUsed: "0.000142 tMSTC",
    details: "Recorded hash for cold_chain_telemetry.pdf",
    status: "confirmed",
  },
  {
    hash: "0x9c8a1726b5d43e2f109876543210feadcba9876543210fedcba9876543210abc",
    type: "CustodyTransferred",
    trackingNumber: "SC-MST-2026-ALPHA",
    blockNumber: 6618948,
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 4 - 120,
    from: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    to: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    gasUsed: "0.000185 tMSTC",
    details: "Custody handed over at JFK Customs",
    status: "confirmed",
  },
  {
    hash: "0x3f1a98c7e6b5d4c3b2a10987654321fedcba9876543210fedcba987654321012",
    type: "StatusUpdated",
    trackingNumber: "SC-MST-2026-BETA",
    blockNumber: 6618945,
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 2,
    from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    gasUsed: "0.000128 tMSTC",
    details: "Status marked as Delivered by Munich Assembly",
    status: "confirmed",
  },
  {
    hash: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
    type: "ShipmentCreated",
    trackingNumber: "SC-MST-2026-ALPHA",
    blockNumber: 6618940,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
    from: "0x71C83605655767b43aBe74D9063d8102a9009893",
    gasUsed: "0.000215 tMSTC",
    details: "Initialized consignment with Bill of Lading hash",
    status: "confirmed",
  },
];

// Rich Initial Demo Consignments
const INITIAL_DEMO_SHIPMENTS: Record<string, Shipment> = {
  "SC-MST-2026-ALPHA": {
    trackingNumber: "SC-MST-2026-ALPHA",
    description: "Cold-Chain Biologics (Insulin & Vaccine Consignment)",
    sender: "0x71C83605655767b43aBe74D9063d8102a9009893",
    recipient: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    currentCustodian: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    origin: "Zurich Pharma Air Hub, Switzerland",
    destination: "St. Jude Medical Center, NY, USA",
    status: ShipmentStatus.InTransit,
    category: "Pharmaceuticals",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
    updatedAt: Math.floor(Date.now() / 1000) - 3600 * 4,
    exists: true,
    custodyHistory: [
      {
        custodian: "0x71C83605655767b43aBe74D9063d8102a9009893",
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
        location: "Zurich Pharma Air Hub, Gate 12",
        note: "Packaged with digital temperature logger (-20°C calibrated)",
        role: "Manufacturer",
        blockNumber: 6618940,
        txHash: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
      },
      {
        custodian: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 1,
        location: "Geneva Air Freight Terminal",
        note: "Accepted by Swiss WorldCargo. Seals verified intact.",
        role: "Air Freight Carrier",
        blockNumber: 6618943,
        txHash: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
      },
      {
        custodian: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        timestamp: Math.floor(Date.now() / 1000) - 3600 * 4,
        location: "JFK International Freight Customs, Bay 4",
        note: "Cleared US FDA customs inspection. Dispatched to refrigerated line-haul.",
        role: "Customs Broker",
        blockNumber: 6618948,
        txHash: "0x9c8a1726b5d43e2f109876543210feadcba9876543210fedcba9876543210abc",
      },
    ],
    documents: [
      {
        documentHash: "0x5f4e64f7b6d8a2a1e8c9d2b5f6a8e1c3b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
        documentType: "Bill of Lading",
        documentName: "bol_insulin_zrh_001.pdf",
        uploadedBy: "0x71C83605655767b43aBe74D9063d8102a9009893",
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
        fileSizeBytes: 245760,
        txHash: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
      },
      {
        documentHash: "0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        documentType: "Temperature Telemetry Report",
        documentName: "cold_chain_telemetry.pdf",
        uploadedBy: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        timestamp: Math.floor(Date.now() / 1000) - 3600 * 4,
        fileSizeBytes: 184320,
        txHash: "0x4b7e2891d6c810fb837a281093847291a823901b2c48e9102834719283746102",
      },
    ],
  },
  "SC-MST-2026-BETA": {
    trackingNumber: "SC-MST-2026-BETA",
    description: "Semiconductor Automotive Wafers (5,000 Units)",
    sender: "0x71C83605655767b43aBe74D9063d8102a9009893",
    recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    currentCustodian: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    origin: "Hsinchu Science Park, Taiwan",
    destination: "Munich Automotive Assembly, Germany",
    status: ShipmentStatus.Delivered,
    category: "High-Tech Electronics",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
    updatedAt: Math.floor(Date.now() / 1000) - 3600 * 2,
    exists: true,
    custodyHistory: [
      {
        custodian: "0x71C83605655767b43aBe74D9063d8102a9009893",
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
        location: "Hsinchu Fab 12 Cleanroom",
        note: "Packaged in anti-static hermetic pods",
        role: "Silicon Foundry",
        blockNumber: 6618930,
      },
      {
        custodian: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        timestamp: Math.floor(Date.now() / 1000) - 3600 * 2,
        location: "Munich Plant Gate 4",
        note: "Accepted by Head of QA. Digital certificate of conformity verified.",
        role: "Recipient",
        blockNumber: 6618945,
        txHash: "0x3f1a98c7e6b5d4c3b2a10987654321fedcba9876543210fedcba987654321012",
      },
    ],
    documents: [
      {
        documentHash: "0x789abc0123456789def0123456789abc0123456789def0123456789abc012345",
        documentType: "Quality Inspection Certificate",
        documentName: "wafer_fab_cert.pdf",
        uploadedBy: "0x71C83605655767b43aBe74D9063d8102a9009893",
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
        fileSizeBytes: 512000,
      },
    ],
  },
  "SC-MST-2026-GAMMA": {
    trackingNumber: "SC-MST-2026-GAMMA",
    description: "Titanium Turbine Blades for Commercial Aviation",
    sender: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    recipient: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    currentCustodian: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    origin: "Sheffield Precision Works, UK",
    destination: "Toulouse Final Assembly Line, France",
    status: ShipmentStatus.Created,
    category: "Aerospace Defense",
    createdAt: Math.floor(Date.now() / 1000) - 3600 * 12,
    updatedAt: Math.floor(Date.now() / 1000) - 3600 * 12,
    exists: true,
    custodyHistory: [
      {
        custodian: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        timestamp: Math.floor(Date.now() / 1000) - 3600 * 12,
        location: "Sheffield High-Alloy Facility",
        note: "Initial crate serialized and registered on MST Blockchain",
        role: "Manufacturer",
        blockNumber: 6618942,
      },
    ],
    documents: [
      {
        documentHash: "0xc8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7",
        documentType: "FAA / EASA Airworthiness Certificate",
        documentName: "easa_form_1_turbine.pdf",
        uploadedBy: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        timestamp: Math.floor(Date.now() / 1000) - 3600 * 12,
        fileSizeBytes: 320000,
      },
    ],
  },
};

let demoStore: Record<string, Shipment> = { ...INITIAL_DEMO_SHIPMENTS };
let txLedgerStore: MSTTransaction[] = [...INITIAL_TRANSACTIONS];

export class ContractService {
  private static getContract(signerOrProvider: JsonRpcSigner | BrowserProvider | JsonRpcProvider): Contract | null {
    if (!SECURE_CHAIN_CONTRACT_ADDRESS) return null;
    return new Contract(SECURE_CHAIN_CONTRACT_ADDRESS, SECURE_CHAIN_ABI, signerOrProvider);
  }

  private static getReadonlyProvider(): JsonRpcProvider {
    return new JsonRpcProvider(DEFAULT_RPC_URL);
  }

  /**
   * Fetches all registered shipments
   */
  public static async getAllShipments(
    provider?: BrowserProvider | null,
    isDemoMode: boolean = false
  ): Promise<Shipment[]> {
    if (isDemoMode || !SECURE_CHAIN_CONTRACT_ADDRESS) {
      return Object.values(demoStore).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    try {
      const activeProvider = provider || this.getReadonlyProvider();
      const contract = this.getContract(activeProvider);
      if (!contract) return Object.values(demoStore);

      const trackingNumbers: string[] = await contract.getAllTrackingNumbers();
      const shipments: Shipment[] = [];

      for (const tn of trackingNumbers) {
        const raw = await contract.getShipment(tn);
        const historyRaw = await contract.getCustodyHistory(tn);
        const docsRaw = await contract.getDocuments(tn);

        shipments.push({
          trackingNumber: raw.trackingNumber,
          description: raw.description,
          sender: raw.sender,
          recipient: raw.recipient,
          currentCustodian: raw.currentCustodian,
          origin: raw.origin,
          destination: raw.destination,
          status: Number(raw.status),
          createdAt: Number(raw.createdAt),
          updatedAt: Number(raw.updatedAt),
          exists: raw.exists,
          custodyHistory: historyRaw.map((h: any) => ({
            custodian: h.custodian,
            timestamp: Number(h.timestamp),
            location: h.location,
            note: h.note,
          })),
          documents: docsRaw.map((d: any) => ({
            documentHash: d.documentHash,
            documentType: d.documentType,
            documentName: d.documentName,
            uploadedBy: d.uploadedBy,
            timestamp: Number(d.timestamp),
          })),
        });
      }

      return shipments.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.warn("Could not query on-chain shipments, falling back to simulated store:", error);
      return Object.values(demoStore).sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }

  /**
   * Returns all recent MST on-chain transactions
   */
  public static getTransactionLedger(): MSTTransaction[] {
    return [...txLedgerStore].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Registers a new shipment
   */
  public static async createShipment(
    input: CreateShipmentInput,
    signer?: JsonRpcSigner | null,
    isDemoMode: boolean = false
  ): Promise<{ success: boolean; txHash: string; blockNumber: number }> {
    currentSimulatedBlock += 1;
    const now = Math.floor(Date.now() / 1000);

    if (isDemoMode || !SECURE_CHAIN_CONTRACT_ADDRESS || !signer) {
      const senderAddr = signer ? await signer.getAddress() : "0x71C83605655767b43aBe74D9063d8102a9009893";
      const txHash = generateTxHash();

      const newShipment: Shipment = {
        trackingNumber: input.trackingNumber,
        description: input.description,
        sender: senderAddr,
        recipient: input.recipient,
        currentCustodian: senderAddr,
        origin: input.origin,
        destination: input.destination,
        status: ShipmentStatus.Created,
        category: input.category || "General Freight",
        createdAt: now,
        updatedAt: now,
        exists: true,
        custodyHistory: [
          {
            custodian: senderAddr,
            timestamp: now,
            location: input.origin,
            note: "Shipment registered on MST Blockchain",
            role: "Consignor",
            blockNumber: currentSimulatedBlock,
            txHash,
          },
        ],
        documents:
          input.initialDocHash && input.initialDocHash !== "0x0000000000000000000000000000000000000000000000000000000000000000"
            ? [
                {
                  documentHash: input.initialDocHash,
                  documentType: input.docType || "Bill of Lading",
                  documentName: input.docName || "document.pdf",
                  uploadedBy: senderAddr,
                  timestamp: now,
                  txHash,
                },
              ]
            : [],
      };

      demoStore[input.trackingNumber] = newShipment;

      // Add to Ledger
      txLedgerStore.unshift({
        hash: txHash,
        type: "ShipmentCreated",
        trackingNumber: input.trackingNumber,
        blockNumber: currentSimulatedBlock,
        timestamp: now,
        from: senderAddr,
        to: input.recipient,
        gasUsed: "0.000195 tMSTC",
        details: `Registered ${input.trackingNumber} (${input.origin} -> ${input.destination})`,
        status: "confirmed",
      });

      return { success: true, txHash, blockNumber: currentSimulatedBlock };
    }

    const contract = this.getContract(signer);
    if (!contract) throw new Error("Contract not initialized");

    const tx = await contract.createShipment(input);
    const receipt = await tx.wait();

    txLedgerStore.unshift({
      hash: receipt.hash,
      type: "ShipmentCreated",
      trackingNumber: input.trackingNumber,
      blockNumber: receipt.blockNumber || currentSimulatedBlock,
      timestamp: now,
      from: await signer.getAddress(),
      to: input.recipient,
      gasUsed: "0.000210 tMSTC",
      details: `Registered on MST Testnet: ${input.trackingNumber}`,
      status: "confirmed",
    });

    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber || currentSimulatedBlock };
  }

  /**
   * Transfers custody of a shipment to the next courier
   */
  public static async transferCustody(
    trackingNumber: string,
    newCustodian: string,
    location: string,
    note: string,
    signer?: JsonRpcSigner | null,
    isDemoMode: boolean = false
  ): Promise<{ success: boolean; txHash: string; blockNumber: number }> {
    currentSimulatedBlock += 1;
    const now = Math.floor(Date.now() / 1000);

    if (isDemoMode || !SECURE_CHAIN_CONTRACT_ADDRESS || !signer) {
      const shipment = demoStore[trackingNumber];
      if (!shipment) throw new Error("Shipment not found");

      const txHash = generateTxHash();
      const previousCustodian = shipment.currentCustodian;
      shipment.currentCustodian = newCustodian;
      shipment.updatedAt = now;
      if (shipment.status === ShipmentStatus.Created) {
        shipment.status = ShipmentStatus.PickedUp;
      } else if (shipment.status === ShipmentStatus.PickedUp) {
        shipment.status = ShipmentStatus.InTransit;
      }

      shipment.custodyHistory = shipment.custodyHistory || [];
      shipment.custodyHistory.push({
        custodian: newCustodian,
        timestamp: now,
        location,
        note,
        blockNumber: currentSimulatedBlock,
        txHash,
      });

      // Add to Ledger
      txLedgerStore.unshift({
        hash: txHash,
        type: "CustodyTransferred",
        trackingNumber,
        blockNumber: currentSimulatedBlock,
        timestamp: now,
        from: previousCustodian,
        to: newCustodian,
        gasUsed: "0.000174 tMSTC",
        details: `Custody passed at ${location}`,
        status: "confirmed",
      });

      return { success: true, txHash, blockNumber: currentSimulatedBlock };
    }

    const contract = this.getContract(signer);
    if (!contract) throw new Error("Contract not initialized");

    const tx = await contract.transferCustody(trackingNumber, newCustodian, location, note);
    const receipt = await tx.wait();

    txLedgerStore.unshift({
      hash: receipt.hash,
      type: "CustodyTransferred",
      trackingNumber,
      blockNumber: receipt.blockNumber || currentSimulatedBlock,
      timestamp: now,
      from: await signer.getAddress(),
      to: newCustodian,
      gasUsed: "0.000185 tMSTC",
      details: `Handed over on MST: ${location}`,
      status: "confirmed",
    });

    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber || currentSimulatedBlock };
  }

  /**
   * Updates shipment status
   */
  public static async updateStatus(
    trackingNumber: string,
    newStatus: ShipmentStatus,
    location: string,
    note: string,
    signer?: JsonRpcSigner | null,
    isDemoMode: boolean = false
  ): Promise<{ success: boolean; txHash: string; blockNumber: number }> {
    currentSimulatedBlock += 1;
    const now = Math.floor(Date.now() / 1000);

    if (isDemoMode || !SECURE_CHAIN_CONTRACT_ADDRESS || !signer) {
      const shipment = demoStore[trackingNumber];
      if (!shipment) throw new Error("Shipment not found");

      const caller = signer ? await signer.getAddress() : shipment.currentCustodian;
      const txHash = generateTxHash();

      shipment.status = newStatus;
      shipment.updatedAt = now;
      if (newStatus === ShipmentStatus.Delivered) {
        shipment.currentCustodian = shipment.recipient;
      }

      shipment.custodyHistory = shipment.custodyHistory || [];
      shipment.custodyHistory.push({
        custodian: caller,
        timestamp: now,
        location,
        note,
        blockNumber: currentSimulatedBlock,
        txHash,
      });

      // Add to Ledger
      txLedgerStore.unshift({
        hash: txHash,
        type: "StatusUpdated",
        trackingNumber,
        blockNumber: currentSimulatedBlock,
        timestamp: now,
        from: caller,
        gasUsed: "0.000135 tMSTC",
        details: `Milestone updated to status #${newStatus} at ${location}`,
        status: "confirmed",
      });

      return { success: true, txHash, blockNumber: currentSimulatedBlock };
    }

    const contract = this.getContract(signer);
    if (!contract) throw new Error("Contract not initialized");

    const tx = await contract.updateStatus(trackingNumber, newStatus, location, note);
    const receipt = await tx.wait();

    txLedgerStore.unshift({
      hash: receipt.hash,
      type: "StatusUpdated",
      trackingNumber,
      blockNumber: receipt.blockNumber || currentSimulatedBlock,
      timestamp: now,
      from: await signer.getAddress(),
      gasUsed: "0.000140 tMSTC",
      details: `Status updated on MST Testnet: ${newStatus}`,
      status: "confirmed",
    });

    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber || currentSimulatedBlock };
  }

  /**
   * Attaches an immutable document hash
   */
  public static async addDocument(
    trackingNumber: string,
    documentHash: string,
    documentType: string,
    documentName: string,
    signer?: JsonRpcSigner | null,
    isDemoMode: boolean = false
  ): Promise<{ success: boolean; txHash: string; blockNumber: number }> {
    currentSimulatedBlock += 1;
    const now = Math.floor(Date.now() / 1000);

    if (isDemoMode || !SECURE_CHAIN_CONTRACT_ADDRESS || !signer) {
      const shipment = demoStore[trackingNumber];
      if (!shipment) throw new Error("Shipment not found");

      const uploader = signer ? await signer.getAddress() : shipment.currentCustodian;
      const txHash = generateTxHash();

      shipment.documents = shipment.documents || [];
      shipment.documents.push({
        documentHash,
        documentType,
        documentName,
        uploadedBy: uploader,
        timestamp: now,
        txHash,
      });
      shipment.updatedAt = now;

      // Add to Ledger
      txLedgerStore.unshift({
        hash: txHash,
        type: "DocumentAdded",
        trackingNumber,
        blockNumber: currentSimulatedBlock,
        timestamp: now,
        from: uploader,
        gasUsed: "0.000155 tMSTC",
        details: `Anchored hash for ${documentName} (${documentType})`,
        status: "confirmed",
      });

      return { success: true, txHash, blockNumber: currentSimulatedBlock };
    }

    const contract = this.getContract(signer);
    if (!contract) throw new Error("Contract not initialized");

    const tx = await contract.addDocument(trackingNumber, documentHash, documentType, documentName);
    const receipt = await tx.wait();

    txLedgerStore.unshift({
      hash: receipt.hash,
      type: "DocumentAdded",
      trackingNumber,
      blockNumber: receipt.blockNumber || currentSimulatedBlock,
      timestamp: now,
      from: await signer.getAddress(),
      gasUsed: "0.000160 tMSTC",
      details: `Document anchored on MST: ${documentName}`,
      status: "confirmed",
    });

    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber || currentSimulatedBlock };
  }

  /**
   * Verifies a document hash against the registered documents of a shipment
   */
  public static async verifyDocument(
    trackingNumber: string,
    documentHash: string,
    provider?: BrowserProvider | null,
    isDemoMode: boolean = false
  ): Promise<VerificationResult> {
    if (isDemoMode || !SECURE_CHAIN_CONTRACT_ADDRESS) {
      const shipment = demoStore[trackingNumber];
      if (!shipment || !shipment.documents) {
        return { isVerified: false, documentType: "", documentName: "", uploadedBy: "", timestamp: 0 };
      }

      const normalizedQuery = documentHash.toLowerCase();
      const match = shipment.documents.find(
        (d) => d.documentHash.toLowerCase() === normalizedQuery
      );

      if (match) {
        return {
          isVerified: true,
          documentType: match.documentType,
          documentName: match.documentName,
          uploadedBy: match.uploadedBy,
          timestamp: match.timestamp,
          blockNumber: currentSimulatedBlock,
          txHash: match.txHash,
        };
      }
      return { isVerified: false, documentType: "", documentName: "", uploadedBy: "", timestamp: 0 };
    }

    try {
      const activeProvider = provider || this.getReadonlyProvider();
      const contract = this.getContract(activeProvider);
      if (!contract) throw new Error("Contract not initialized");

      const result = await contract.verifyDocument(trackingNumber, documentHash);
      return {
        isVerified: result.isVerified,
        documentType: result.documentType,
        documentName: result.documentName,
        uploadedBy: result.uploadedBy,
        timestamp: Number(result.timestamp),
      };
    } catch (error) {
      console.warn("Could not verify document on-chain:", error);
      return { isVerified: false, documentType: "", documentName: "", uploadedBy: "", timestamp: 0 };
    }
  }

  /**
   * Simulates Enterprise Scalability by batch-injecting real-world global shipments
   */
  public static simulateEnterpriseScale(): Shipment[] {
    const enterpriseTemplates = [
      {
        trackingNumber: "SC-MST-SCALE-001",
        description: "10,000 mRNA Vaccine Dials (-70°C Ultra-Cold Chain)",
        origin: "Mainz Biotechnology Campus, Germany",
        destination: "Dubai Healthcare City Logistics Hub, UAE",
        category: "Pharmaceuticals",
        sender: "0x71C83605655767b43aBe74D9063d8102a9009893",
        recipient: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        docType: "WHO Cold-Chain Telemetry Log",
        docName: "mrna_temp_telemetry_batch10k.pdf",
      },
      {
        trackingNumber: "SC-MST-SCALE-002",
        description: "Precision Jet Engine Discs (Nickel-Superalloy)",
        origin: "Cincinnati Propulsion Center, OH, USA",
        destination: "Tokyo Haneda Aircraft Maintenance Base, Japan",
        category: "Aerospace Defense",
        sender: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        recipient: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        docType: "Certificate of Airworthiness (EASA/FAA)",
        docName: "jet_disc_airworthiness.pdf",
      },
      {
        trackingNumber: "SC-MST-SCALE-003",
        description: "Subsea Optical Fiber Repeaters (Deep-Ocean Grade)",
        origin: "Calais Submarine Cable Works, France",
        destination: "Singapore Jurong Marine Terminal",
        category: "Telecommunications",
        sender: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        docType: "Pressure & Optical Integrity Test",
        docName: "deepsea_pressure_cert.pdf",
      },
    ];

    const now = Math.floor(Date.now() / 1000);

    for (const item of enterpriseTemplates) {
      if (!demoStore[item.trackingNumber]) {
        currentSimulatedBlock += 1;
        const txHash = generateTxHash();
        const docHash = generateTxHash();

        demoStore[item.trackingNumber] = {
          trackingNumber: item.trackingNumber,
          description: item.description,
          sender: item.sender,
          recipient: item.recipient,
          currentCustodian: item.sender,
          origin: item.origin,
          destination: item.destination,
          status: ShipmentStatus.PickedUp,
          category: item.category,
          createdAt: now - 3600 * 6,
          updatedAt: now - 600,
          exists: true,
          custodyHistory: [
            {
              custodian: item.sender,
              timestamp: now - 3600 * 6,
              location: item.origin,
              note: "Batch serialized and registered on MST Blockchain",
              role: "Consignor",
              blockNumber: currentSimulatedBlock - 1,
              txHash,
            },
          ],
          documents: [
            {
              documentHash: docHash,
              documentType: item.docType,
              documentName: item.docName,
              uploadedBy: item.sender,
              timestamp: now - 3600 * 6,
              txHash,
            },
          ],
        };

        txLedgerStore.unshift({
          hash: txHash,
          type: "ShipmentCreated",
          trackingNumber: item.trackingNumber,
          blockNumber: currentSimulatedBlock,
          timestamp: now,
          from: item.sender,
          to: item.recipient,
          gasUsed: "0.000188 tMSTC",
          details: `Enterprise scale injection: ${item.trackingNumber}`,
          status: "confirmed",
        });
      }
    }

    return Object.values(demoStore).sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
