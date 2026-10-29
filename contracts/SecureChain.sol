// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureChain
 * @notice Blockchain-Based Logistics Security and Shipment Verification Platform
 * @dev Designed for MST Blockchain BUILDATHON 2.0 (MST Testnet Chain ID: 91562037)
 */
contract SecureChain {
    enum ShipmentStatus {
        Created,         // 0: Shipment created and registered on-chain
        PickedUp,        // 1: Carrier picked up the package
        InTransit,       // 2: In transit between logistics hubs
        OutForDelivery,  // 3: Out for final delivery to recipient
        Delivered,       // 4: Successfully received and verified by recipient
        Cancelled        // 5: Shipment cancelled
    }

    struct CustodyRecord {
        address custodian;
        uint256 timestamp;
        string location;
        string note;
    }

    struct DocumentRecord {
        bytes32 documentHash;
        string documentType;    // e.g., "Bill of Lading", "Customs Invoice", "Inspection Cert"
        string documentName;    // e.g., "bol_sc1001.pdf"
        address uploadedBy;
        uint256 timestamp;
    }

    struct Shipment {
        string trackingNumber;
        string description;
        address sender;
        address recipient;
        address currentCustodian;
        string origin;
        string destination;
        ShipmentStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    struct CreateShipmentInput {
        string trackingNumber;
        string description;
        address recipient;
        string origin;
        string destination;
        bytes32 initialDocHash;
        string docType;
        string docName;
    }

    struct VerificationResult {
        bool isVerified;
        string documentType;
        string documentName;
        address uploadedBy;
        uint256 timestamp;
    }

    // Storage
    mapping(string => Shipment) private _shipments;
    mapping(string => CustodyRecord[]) private _custodyHistory;
    mapping(string => DocumentRecord[]) private _documents;
    mapping(address => string[]) private _userShipments;
    string[] private _allTrackingNumbers;

    // Events for tracking & indexers
    event ShipmentCreated(
        string indexed trackingNumber,
        address indexed sender,
        address indexed recipient,
        string origin,
        string destination,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed trackingNumber,
        address indexed previousCustodian,
        address indexed newCustodian,
        string location,
        string note,
        uint256 timestamp
    );

    event StatusUpdated(
        string indexed trackingNumber,
        ShipmentStatus status,
        address indexed updatedBy,
        string location,
        string note,
        uint256 timestamp
    );

    event DocumentAdded(
        string indexed trackingNumber,
        bytes32 indexed documentHash,
        string documentType,
        string documentName,
        address indexed uploadedBy,
        uint256 timestamp
    );

    // Modifiers
    modifier shipmentExists(string calldata trackingNumber) {
        require(_shipments[trackingNumber].exists, "SecureChain: Shipment does not exist");
        _;
    }

    modifier onlyAuthorized(string calldata trackingNumber) {
        Shipment storage s = _shipments[trackingNumber];
        require(s.exists, "SecureChain: Shipment does not exist");
        require(
            msg.sender == s.currentCustodian || 
            msg.sender == s.sender || 
            msg.sender == s.recipient,
            "SecureChain: Unauthorized - caller is neither custodian, sender, nor recipient"
        );
        _;
    }

    modifier onlyCurrentCustodian(string calldata trackingNumber) {
        Shipment storage s = _shipments[trackingNumber];
        require(s.exists, "SecureChain: Shipment does not exist");
        require(
            msg.sender == s.currentCustodian,
            "SecureChain: Caller is not the current custodian"
        );
        _;
    }

    /**
     * @notice Register a new shipment on SecureChain
     * @param input Struct containing tracking number, recipient, origin, destination, and initial document
     */
    function createShipment(CreateShipmentInput calldata input) external {
        require(bytes(input.trackingNumber).length > 0, "SecureChain: Tracking number cannot be empty");
        require(!_shipments[input.trackingNumber].exists, "SecureChain: Tracking number already exists");
        require(input.recipient != address(0), "SecureChain: Recipient cannot be zero address");
        require(input.recipient != msg.sender, "SecureChain: Recipient cannot be the sender");

        _shipments[input.trackingNumber] = Shipment({
            trackingNumber: input.trackingNumber,
            description: input.description,
            sender: msg.sender,
            recipient: input.recipient,
            currentCustodian: msg.sender,
            origin: input.origin,
            destination: input.destination,
            status: ShipmentStatus.Created,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });

        _allTrackingNumbers.push(input.trackingNumber);
        _userShipments[msg.sender].push(input.trackingNumber);
        _userShipments[input.recipient].push(input.trackingNumber);

        // Record initial custody record
        _custodyHistory[input.trackingNumber].push(CustodyRecord({
            custodian: msg.sender,
            timestamp: block.timestamp,
            location: input.origin,
            note: "Shipment registered by sender"
        }));

        emit ShipmentCreated(
            input.trackingNumber,
            msg.sender,
            input.recipient,
            input.origin,
            input.destination,
            block.timestamp
        );

        // Attach initial document if provided
        if (input.initialDocHash != bytes32(0)) {
            string memory docType = bytes(input.docType).length > 0 ? input.docType : "Bill of Lading";
            string memory docName = bytes(input.docName).length > 0 ? input.docName : "document.pdf";

            _documents[input.trackingNumber].push(DocumentRecord({
                documentHash: input.initialDocHash,
                documentType: docType,
                documentName: docName,
                uploadedBy: msg.sender,
                timestamp: block.timestamp
            }));

            emit DocumentAdded(
                input.trackingNumber,
                input.initialDocHash,
                docType,
                docName,
                msg.sender,
                block.timestamp
            );
        }
    }

    /**
     * @notice Transfer custody to the next handler/carrier in the supply chain
     * @dev Only the current custodian can transfer custody
     */
    function transferCustody(
        string calldata trackingNumber,
        address newCustodian,
        string calldata location,
        string calldata note
    ) external onlyCurrentCustodian(trackingNumber) {
        require(newCustodian != address(0), "SecureChain: New custodian cannot be zero address");
        Shipment storage s = _shipments[trackingNumber];
        require(
            s.status != ShipmentStatus.Delivered && s.status != ShipmentStatus.Cancelled,
            "SecureChain: Cannot transfer custody of delivered or cancelled shipment"
        );
        require(newCustodian != s.currentCustodian, "SecureChain: New custodian must be different from current");

        address previousCustodian = s.currentCustodian;
        s.currentCustodian = newCustodian;
        s.updatedAt = block.timestamp;

        // Auto update status if currently just Created or PickedUp
        if (s.status == ShipmentStatus.Created) {
            s.status = ShipmentStatus.PickedUp;
        } else if (s.status == ShipmentStatus.PickedUp) {
            s.status = ShipmentStatus.InTransit;
        }

        _custodyHistory[trackingNumber].push(CustodyRecord({
            custodian: newCustodian,
            timestamp: block.timestamp,
            location: location,
            note: note
        }));

        _userShipments[newCustodian].push(trackingNumber);

        emit CustodyTransferred(
            trackingNumber,
            previousCustodian,
            newCustodian,
            location,
            note,
            block.timestamp
        );
    }

    /**
     * @notice Update shipment delivery status
     * @dev Authorized users: Current Custodian or Sender; Recipient can also mark Delivered
     */
    function updateStatus(
        string calldata trackingNumber,
        ShipmentStatus newStatus,
        string calldata location,
        string calldata note
    ) external shipmentExists(trackingNumber) {
        Shipment storage s = _shipments[trackingNumber];
        require(
            s.status != ShipmentStatus.Delivered && s.status != ShipmentStatus.Cancelled,
            "SecureChain: Cannot update status of delivered or cancelled shipment"
        );

        // Security check: Only custodian or sender can advance status; Recipient can confirm Delivered
        if (newStatus == ShipmentStatus.Delivered) {
            require(
                msg.sender == s.currentCustodian || msg.sender == s.recipient || msg.sender == s.sender,
                "SecureChain: Only custodian, recipient, or sender can mark as delivered"
            );
            // If recipient marks delivered, custodian becomes recipient
            s.currentCustodian = s.recipient;
        } else if (newStatus == ShipmentStatus.Cancelled) {
            require(
                msg.sender == s.sender,
                "SecureChain: Only original sender can cancel shipment"
            );
        } else {
            require(
                msg.sender == s.currentCustodian || msg.sender == s.sender,
                "SecureChain: Only custodian or sender can update transit status"
            );
        }

        s.status = newStatus;
        s.updatedAt = block.timestamp;

        _custodyHistory[trackingNumber].push(CustodyRecord({
            custodian: msg.sender,
            timestamp: block.timestamp,
            location: location,
            note: note
        }));

        emit StatusUpdated(
            trackingNumber,
            newStatus,
            msg.sender,
            location,
            note,
            block.timestamp
        );
    }

    /**
     * @notice Attach an immutable document cryptographic hash (SHA-256 / Keccak-256) to a shipment
     * @dev Only sender, current custodian, or recipient can attach documents
     */
    function addDocument(
        string calldata trackingNumber,
        bytes32 documentHash,
        string calldata documentType,
        string calldata documentName
    ) external onlyAuthorized(trackingNumber) {
        require(documentHash != bytes32(0), "SecureChain: Document hash cannot be empty");
        require(bytes(documentName).length > 0, "SecureChain: Document name cannot be empty");

        _documents[trackingNumber].push(DocumentRecord({
            documentHash: documentHash,
            documentType: documentType,
            documentName: documentName,
            uploadedBy: msg.sender,
            timestamp: block.timestamp
        }));

        _shipments[trackingNumber].updatedAt = block.timestamp;

        emit DocumentAdded(
            trackingNumber,
            documentHash,
            documentType,
            documentName,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verify whether a given document hash matches any recorded document for the shipment
     * @dev Used for browser drag-and-drop document integrity verification
     */
    function verifyDocument(
        string calldata trackingNumber,
        bytes32 documentHash
    ) external view shipmentExists(trackingNumber) returns (VerificationResult memory) {
        DocumentRecord[] storage docs = _documents[trackingNumber];
        for (uint256 i = 0; i < docs.length; i++) {
            if (docs[i].documentHash == documentHash) {
                return VerificationResult({
                    isVerified: true,
                    documentType: docs[i].documentType,
                    documentName: docs[i].documentName,
                    uploadedBy: docs[i].uploadedBy,
                    timestamp: docs[i].timestamp
                });
            }
        }
        return VerificationResult({
            isVerified: false,
            documentType: "",
            documentName: "",
            uploadedBy: address(0),
            timestamp: 0
        });
    }

    // View Functions for Dashboard

    function getShipment(string calldata trackingNumber) 
        external 
        view 
        shipmentExists(trackingNumber) 
        returns (Shipment memory) 
    {
        return _shipments[trackingNumber];
    }

    function getCustodyHistory(string calldata trackingNumber) 
        external 
        view 
        shipmentExists(trackingNumber) 
        returns (CustodyRecord[] memory) 
    {
        return _custodyHistory[trackingNumber];
    }

    function getDocuments(string calldata trackingNumber) 
        external 
        view 
        shipmentExists(trackingNumber) 
        returns (DocumentRecord[] memory) 
    {
        return _documents[trackingNumber];
    }

    function getAllTrackingNumbers() external view returns (string[] memory) {
        return _allTrackingNumbers;
    }

    function getTotalShipmentsCount() external view returns (uint256) {
        return _allTrackingNumbers.length;
    }

    function getUserShipments(address user) external view returns (string[] memory) {
        return _userShipments[user];
    }
}
