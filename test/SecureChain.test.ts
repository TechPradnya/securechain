import { expect } from "chai";
import { ethers } from "hardhat";
import { SecureChain } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SecureChain Smart Contract", function () {
  let secureChain: SecureChain;
  let sender: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let courier1: HardhatEthersSigner;
  let courier2: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  const sampleTrackingNum = "SC-MST-2026-001";
  const sampleDocHash = ethers.keccak256(ethers.toUtf8Bytes("Bill of Lading #12345: 50 Containers of Electronics"));

  beforeEach(async function () {
    [sender, recipient, courier1, courier2, unauthorizedUser] = await ethers.getSigners();

    const SecureChainFactory = await ethers.getContractFactory("SecureChain");
    secureChain = await SecureChainFactory.deploy();
    await secureChain.waitForDeployment();
  });

  describe("1. Shipment Registration", function () {
    it("Should successfully register a new shipment with an initial document hash", async function () {
      const tx = await secureChain.connect(sender).createShipment({
        trackingNumber: sampleTrackingNum,
        description: "High-value Electronics Consignment",
        recipient: recipient.address,
        origin: "Singapore Logistics Hub",
        destination: "Frankfurt Central Freight",
        initialDocHash: sampleDocHash,
        docType: "Bill of Lading",
        docName: "bill_of_lading_bol12345.pdf"
      });

      await expect(tx)
        .to.emit(secureChain, "ShipmentCreated")
        .withArgs(
          sampleTrackingNum,
          sender.address,
          recipient.address,
          "Singapore Logistics Hub",
          "Frankfurt Central Freight",
          await ethers.provider.getBlock("latest").then(b => b!.timestamp)
        );

      const shipment = await secureChain.getShipment(sampleTrackingNum);
      expect(shipment.trackingNumber).to.equal(sampleTrackingNum);
      expect(shipment.sender).to.equal(sender.address);
      expect(shipment.recipient).to.equal(recipient.address);
      expect(shipment.currentCustodian).to.equal(sender.address);
      expect(shipment.status).to.equal(0); // ShipmentStatus.Created
      expect(shipment.origin).to.equal("Singapore Logistics Hub");
      expect(shipment.destination).to.equal("Frankfurt Central Freight");

      // Check custody history initialized
      const history = await secureChain.getCustodyHistory(sampleTrackingNum);
      expect(history.length).to.equal(1);
      expect(history[0].custodian).to.equal(sender.address);
      expect(history[0].location).to.equal("Singapore Logistics Hub");

      // Check initial document record
      const docs = await secureChain.getDocuments(sampleTrackingNum);
      expect(docs.length).to.equal(1);
      expect(docs[0].documentHash).to.equal(sampleDocHash);
      expect(docs[0].documentType).to.equal("Bill of Lading");
      expect(docs[0].uploadedBy).to.equal(sender.address);
    });

    it("Should prevent duplicate tracking numbers", async function () {
      await secureChain.connect(sender).createShipment({
        trackingNumber: sampleTrackingNum,
        description: "Electronics",
        recipient: recipient.address,
        origin: "Tokyo",
        destination: "London",
        initialDocHash: ethers.ZeroHash,
        docType: "",
        docName: ""
      });

      await expect(
        secureChain.connect(sender).createShipment({
          trackingNumber: sampleTrackingNum,
          description: "Second Shipment",
          recipient: recipient.address,
          origin: "Tokyo",
          destination: "London",
          initialDocHash: ethers.ZeroHash,
          docType: "",
          docName: ""
        })
      ).to.be.revertedWith("SecureChain: Tracking number already exists");
    });

    it("Should prevent registering with recipient as zero address or same as sender", async function () {
      await expect(
        secureChain.connect(sender).createShipment({
          trackingNumber: "SC-002",
          description: "Electronics",
          recipient: ethers.ZeroAddress,
          origin: "Tokyo",
          destination: "London",
          initialDocHash: ethers.ZeroHash,
          docType: "",
          docName: ""
        })
      ).to.be.revertedWith("SecureChain: Recipient cannot be zero address");

      await expect(
        secureChain.connect(sender).createShipment({
          trackingNumber: "SC-003",
          description: "Electronics",
          recipient: sender.address,
          origin: "Tokyo",
          destination: "London",
          initialDocHash: ethers.ZeroHash,
          docType: "",
          docName: ""
        })
      ).to.be.revertedWith("SecureChain: Recipient cannot be the sender");
    });
  });

  describe("2. Custody Transfer & Authorization Checks", function () {
    beforeEach(async function () {
      await secureChain.connect(sender).createShipment({
        trackingNumber: sampleTrackingNum,
        description: "Electronics Consignment",
        recipient: recipient.address,
        origin: "Singapore Port",
        destination: "Rotterdam Port",
        initialDocHash: sampleDocHash,
        docType: "Bill of Lading",
        docName: "bol.pdf"
      });
    });

    it("Should allow current custodian to transfer custody to courier1", async function () {
      await expect(
        secureChain.connect(sender).transferCustody(
          sampleTrackingNum,
          courier1.address,
          "Singapore Port Terminal 3",
          "Handed over to Pacific Freight Carrier"
        )
      ).to.emit(secureChain, "CustodyTransferred")
        .withArgs(
          sampleTrackingNum,
          sender.address,
          courier1.address,
          "Singapore Port Terminal 3",
          "Handed over to Pacific Freight Carrier",
          await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
        );

      const shipment = await secureChain.getShipment(sampleTrackingNum);
      expect(shipment.currentCustodian).to.equal(courier1.address);
      expect(shipment.status).to.equal(1); // Auto-advanced to PickedUp

      // Check custody history length
      const history = await secureChain.getCustodyHistory(sampleTrackingNum);
      expect(history.length).to.equal(2);
      expect(history[1].custodian).to.equal(courier1.address);
      expect(history[1].note).to.equal("Handed over to Pacific Freight Carrier");
    });

    it("Should REJECT custody transfer if called by unauthorized user", async function () {
      await expect(
        secureChain.connect(unauthorizedUser).transferCustody(
          sampleTrackingNum,
          courier1.address,
          "Warehouse X",
          "Unauthorized transfer attempt"
        )
      ).to.be.revertedWith("SecureChain: Caller is not the current custodian");
    });

    it("Should allow sequential custody handovers (sender -> courier1 -> courier2)", async function () {
      // 1. Sender -> Courier1
      await secureChain.connect(sender).transferCustody(
        sampleTrackingNum,
        courier1.address,
        "Origin Hub",
        "Carrier 1 pickup"
      );

      // 2. Courier1 -> Courier2
      await secureChain.connect(courier1).transferCustody(
        sampleTrackingNum,
        courier2.address,
        "Transit Hub Dubai",
        "Transferred to Air Cargo Carrier 2"
      );

      const shipment = await secureChain.getShipment(sampleTrackingNum);
      expect(shipment.currentCustodian).to.equal(courier2.address);
      expect(shipment.status).to.equal(2); // Auto-advanced to InTransit

      const history = await secureChain.getCustodyHistory(sampleTrackingNum);
      expect(history.length).to.equal(3);
      expect(history[0].custodian).to.equal(sender.address);
      expect(history[1].custodian).to.equal(courier1.address);
      expect(history[2].custodian).to.equal(courier2.address);
    });

    it("Should REJECT original sender from transferring custody once it is with courier1", async function () {
      await secureChain.connect(sender).transferCustody(
        sampleTrackingNum,
        courier1.address,
        "Origin Hub",
        "Carrier 1 pickup"
      );

      // Sender is no longer current custodian
      await expect(
        secureChain.connect(sender).transferCustody(
          sampleTrackingNum,
          courier2.address,
          "Origin Hub",
          "Attempt by previous custodian"
        )
      ).to.be.revertedWith("SecureChain: Caller is not the current custodian");
    });
  });

  describe("3. Status Updates & Delivery Confirmation", function () {
    beforeEach(async function () {
      await secureChain.connect(sender).createShipment({
        trackingNumber: sampleTrackingNum,
        description: "Medical Equipment",
        recipient: recipient.address,
        origin: "Boston, MA",
        destination: "Berlin, Germany",
        initialDocHash: sampleDocHash,
        docType: "Customs Declaration",
        docName: "customs_decl.pdf"
      });
    });

    it("Should allow custodian to update status to OutForDelivery", async function () {
      await secureChain.connect(sender).updateStatus(
        sampleTrackingNum,
        3, // OutForDelivery
        "Berlin Distribution Center",
        "Loaded on final mile van"
      );

      const shipment = await secureChain.getShipment(sampleTrackingNum);
      expect(shipment.status).to.equal(3);
    });

    it("Should allow recipient to confirm Delivered status", async function () {
      await secureChain.connect(recipient).updateStatus(
        sampleTrackingNum,
        4, // Delivered
        "Berlin Delivery Address",
        "Received in good condition"
      );

      const shipment = await secureChain.getShipment(sampleTrackingNum);
      expect(shipment.status).to.equal(4);
      expect(shipment.currentCustodian).to.equal(recipient.address);
    });

    it("Should REJECT unauthorized user from updating status", async function () {
      await expect(
        secureChain.connect(unauthorizedUser).updateStatus(
          sampleTrackingNum,
          3, // OutForDelivery
          "Random Location",
          "Malicious update attempt"
        )
      ).to.be.revertedWith("SecureChain: Only custodian or sender can update transit status");
    });

    it("Should prevent further updates once Delivered", async function () {
      await secureChain.connect(recipient).updateStatus(
        sampleTrackingNum,
        4, // Delivered
        "Destination",
        "Package signed for"
      );

      await expect(
        secureChain.connect(sender).updateStatus(
          sampleTrackingNum,
          2, // InTransit
          "Nowhere",
          "Re-open attempt"
        )
      ).to.be.revertedWith("SecureChain: Cannot update status of delivered or cancelled shipment");
    });
  });

  describe("4. Document Integrity Verification", function () {
    const inspectionCertHash = ethers.keccak256(ethers.toUtf8Bytes("Quality Inspection Certificate - Passed QA #991"));

    beforeEach(async function () {
      await secureChain.connect(sender).createShipment({
        trackingNumber: sampleTrackingNum,
        description: "Pharmaceutical Cold Chain",
        recipient: recipient.address,
        origin: "Zurich Lab",
        destination: "Tokyo Hospital",
        initialDocHash: sampleDocHash,
        docType: "Bill of Lading",
        docName: "bol.pdf"
      });
    });

    it("Should allow authorized participant to add additional document hashes", async function () {
      await expect(
        secureChain.connect(sender).addDocument(
          sampleTrackingNum,
          inspectionCertHash,
          "Quality Inspection Certificate",
          "qa_cert_991.pdf"
        )
      ).to.emit(secureChain, "DocumentAdded")
        .withArgs(
          sampleTrackingNum,
          inspectionCertHash,
          "Quality Inspection Certificate",
          "qa_cert_991.pdf",
          sender.address,
          await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
        );

      const docs = await secureChain.getDocuments(sampleTrackingNum);
      expect(docs.length).to.equal(2);
      expect(docs[1].documentHash).to.equal(inspectionCertHash);
      expect(docs[1].documentName).to.equal("qa_cert_991.pdf");
    });

    it("Should REJECT unauthorized user from adding documents", async function () {
      await expect(
        secureChain.connect(unauthorizedUser).addDocument(
          sampleTrackingNum,
          inspectionCertHash,
          "Forged Document",
          "forged.pdf"
        )
      ).to.be.revertedWith("SecureChain: Unauthorized - caller is neither custodian, sender, nor recipient");
    });

    it("Should successfully verify authentic document hash", async function () {
      const result = await secureChain.verifyDocument(sampleTrackingNum, sampleDocHash);
      expect(result.isVerified).to.be.true;
      expect(result.documentType).to.equal("Bill of Lading");
      expect(result.documentName).to.equal("bol.pdf");
      expect(result.uploadedBy).to.equal(sender.address);
    });

    it("Should detect and fail verification for tampered/modified document hash", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("TAMPERED FILE CONTENTS"));
      const result = await secureChain.verifyDocument(sampleTrackingNum, tamperedHash);
      expect(result.isVerified).to.be.false;
      expect(result.documentType).to.equal("");
    });
  });

  describe("5. Query & Dashboard Views", function () {
    it("Should track all shipments and user-specific shipments", async function () {
      await secureChain.connect(sender).createShipment({
        trackingNumber: "SC-001",
        description: "Cargo 1",
        recipient: recipient.address,
        origin: "City A",
        destination: "City B",
        initialDocHash: ethers.ZeroHash,
        docType: "",
        docName: ""
      });

      await secureChain.connect(sender).createShipment({
        trackingNumber: "SC-002",
        description: "Cargo 2",
        recipient: courier1.address,
        origin: "City C",
        destination: "City D",
        initialDocHash: ethers.ZeroHash,
        docType: "",
        docName: ""
      });

      const all = await secureChain.getAllTrackingNumbers();
      expect(all.length).to.equal(2);
      expect(all[0]).to.equal("SC-001");
      expect(all[1]).to.equal("SC-002");

      const total = await secureChain.getTotalShipmentsCount();
      expect(total).to.equal(2);

      const senderShipments = await secureChain.getUserShipments(sender.address);
      expect(senderShipments.length).to.equal(2);

      const recipientShipments = await secureChain.getUserShipments(recipient.address);
      expect(recipientShipments.length).to.equal(1);
      expect(recipientShipments[0]).to.equal("SC-001");
    });
  });
});
