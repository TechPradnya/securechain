# SecureChain 🛡️📦
**Blockchain-Based Logistics Security and Shipment Verification Platform**
*Built for the MST Blockchain BUILDATHON 2.0*

---

## 🚀 Overview

**SecureChain** is a decentralized supply chain security platform built specifically for the **MST Blockchain Testnet**. It solves traditional logistics vulnerabilities—such as cargo theft, counterfeit goods, fraudulent custody handovers, and tampered paper bills of lading—by creating an immutable, cryptographically verifiable record of shipment events on-chain.

### Key Capabilities
1. **Shipment Lifecycle Tracking**: Register consignments on-chain with unique tracking IDs, sender, designated recipient, and route.
2. **Custody Transfer Chain**: Every custody transfer between carriers, freight handlers, and warehouses is recorded immutably on the MST Blockchain with timestamps, locations, and handler notes.
3. **Role-Based Authorization**: Only the active custodian or authorized parties can transfer custody or advance shipment status. Unauthorized addresses are blocked at the smart contract level.
4. **Browser-Based Document Integrity Verification**: Invoices, bills of lading, and inspection certificates are cryptographically fingerprinted in the browser using the Web Crypto API. Anyone can drop a document into the verifier to check whether it matches the on-chain record or has been tampered with.
5. **BridgeKey & MST Blockchain Integration**: Configured with one-click network switching for MST Blockchain Testnet (Chain ID `91562037`, currency `tMSTC`).

---

## 🌐 MST Blockchain Testnet Parameters

| Parameter | Value |
| :--- | :--- |
| **Network Name** | MST Blockchain Testnet |
| **RPC URL** | `https://testnetrpc.mstblockchain.com` |
| **Chain ID** | `91562037` (`0x5752315` in hexadecimal) |
| **Currency Symbol** | `tMSTC` |
| **Decimals** | `18` |
| **Block Explorer** | [https://testnet.mstscan.com](https://testnet.mstscan.com) |

---

## 📁 Project Architecture & Folder Structure

```
securechain/
├── contracts/
│   └── SecureChain.sol           # Solidity smart contract for shipments & custody
├── scripts/
│   ├── check-network.ts          # Checks live connectivity to MST Testnet RPC
│   └── deploy.ts                 # Deploys SecureChain to MST Testnet
├── test/
│   └── SecureChain.test.ts       # 16 automated tests covering authorization & logic
├── hardhat.config.ts             # Hardhat network configuration for MST Testnet
├── package.json                  # Root dependencies & convenience scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── frontend/                     # React + TypeScript Frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx               # Main application layout & tabs
│       ├── main.tsx              # React DOM root & WalletProvider
│       ├── components/
│       │   ├── Navbar.tsx        # Header, network status, wallet button
│       │   ├── ShipmentList.tsx  # Dashboard, filters, and KPI metrics
│       │   ├── ShipmentCard.tsx  # Shipment overview cards
│       │   ├── ShipmentDetail.tsx# Detail view with custody timeline
│       │   ├── CreateShipmentModal.tsx # Registration modal with file hashing
│       │   ├── TransferCustodyModal.tsx # Carrier custody handover
│       │   ├── UpdateStatusModal.tsx    # Delivery milestone updater
│       │   ├── AddDocumentModal.tsx     # Attach additional document hashes
│       │   ├── DocumentVerifier.tsx     # Client-side hash verification tool
│       │   └── NetworkGuide.tsx         # MST parameters & deployment instructions
│       ├── context/
│       │   └── WalletContext.tsx # BridgeKey connection state & network switcher
│       ├── config/
│       │   ├── mstNetwork.ts     # MST Testnet RPC, chain ID, and explorer
│       │   └── contractConfig.ts # Deployed contract address and ABI
│       ├── services/
│       │   └── contractService.ts# Contract bridge with testnet and fallback mode
│       └── utils/
│           ├── cryptoHash.ts     # Web Crypto API & Keccak-256 browser hashing
│           └── formatters.ts     # Address formatting, timestamps, explorer links
└── README.md
```

---

## ⚡ Quick Start Guide (Beginner Friendly)

### 1. Run Automated Smart Contract Tests
Run the comprehensive 16-test suite testing registration, access controls, multi-hop handovers, and document verification:
```bash
npm test
```
All 16 unit tests will execute and pass against the compiled smart contract.

### 2. Verify Connection to MST Testnet RPC
Check live network connectivity, block height, and Chain ID match against the MST Testnet:
```bash
npm run check-network
```
Output:
```
Checking connection to MST Blockchain Testnet...
Connected successfully!
Chain ID: 91562037
Expected Chain ID: 91562037
✓ Chain ID match confirmed for MST Blockchain Testnet.
Latest block on MST Testnet: #...
```

### 3. Launch the Frontend Development Server
Start the React + TypeScript frontend locally:
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🚢 Deploying to MST Testnet

> [!IMPORTANT]
> **Safety Notice**: Never commit a private key or seed phrase to GitHub. Only use a disposable developer account with testnet funds for testnet deployments.

1. Create a `.env` file in the project root:
   ```env
   MST_RPC_URL=https://testnetrpc.mstblockchain.com
   PRIVATE_KEY=your_disposable_testnet_private_key
   ```
2. Ensure the account has `tMSTC` testnet tokens for deployment gas fees.
3. Run the deployment script:
   ```bash
   npm run deploy:testnet
   ```
4. The script will deploy the contract, log the transaction hash and explorer link, and automatically update `frontend/src/config/contractConfig.ts`.

---

## 🛡️ Document Integrity Verification: How It Works

1. **Local Hashing**: When a logistics manager attaches a document (e.g. Bill of Lading, Customs Clearance), the browser computes its 256-bit cryptographic hash (`keccak256` / `SHA-256`) using the native browser Web Crypto API.
2. **On-Chain Fingerprint**: Only the resulting 32-byte hash is recorded into the smart contract on the MST Blockchain. Confidential commercial documents never leave the client device.
3. **Verification**: Any recipient, customs inspector, or auditor can upload the file into the **Document Verifier** tab:
   - The browser calculates the hash of the uploaded file.
   - The smart contract queries `verifyDocument(trackingNumber, hash)`.
   - If identical: **"VERIFIED AUTHENTIC — 100% MATCH"** (with uploader address and registration timestamp).
   - If even a single byte or price is changed: **"TAMPERING DETECTED / NO ON-CHAIN MATCH"**.

---

## 📜 License
MIT License - Built for MST Blockchain BUILDATHON 2.0.
