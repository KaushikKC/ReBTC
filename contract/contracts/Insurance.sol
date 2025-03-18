// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BtcInsurancePool
 * @dev Provides insurance coverage for lstBTC holders against various risks
 * Insurance is funded by allocating a portion of yield from deposits
 */
contract BtcInsurancePool is ReentrancyGuard, AccessControl {
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant YIELD_PROVIDER_ROLE =
        keccak256("YIELD_PROVIDER_ROLE");

    // The lstBTC token contract
    IERC20 public lstBtcToken;

    // Insurance parameters
    uint256 public coveragePercentage = 80; // 80% coverage by default
    uint256 public premiumPercentage = 10; // 10% of yield goes to insurance by default
    uint256 public claimWaitingPeriod = 2 days; // Waiting period before claim processing
    uint256 public maxCoverageAmount = 100 ether; // Maximum coverage per user

    // Insurance pool state
    uint256 public totalInsuranceReserve; // Total funds in the insurance pool
    uint256 public totalCoveredAmount; // Total amount covered by insurance
    uint256 public totalClaimsPaid;

    // Claim status enums
    enum ClaimStatus {
        NotSubmitted,
        Pending,
        Approved,
        Rejected,
        Paid
    }

    // Insurance coverage for users
    struct Coverage {
        uint256 coveredAmount; // Amount covered
        uint256 startTime; // When coverage started
        uint256 endTime; // When coverage ends (0 for indefinite)
        bool active; // Whether coverage is active
    }

    // Claim details
    struct Claim {
        uint256 claimId;
        address claimant;
        uint256 amount;
        string reason;
        uint256 submissionTime;
        ClaimStatus status;
        uint256 processingTime;
        string rejectionReason;
    }

    // Insurance events
    struct InsuranceEvent {
        uint256 eventId;
        string eventType; // "liquidation", "hack", "slashing", etc.
        uint256 timestamp;
        bool resolved;
        string description;
    }

    // Mappings
    mapping(address => Coverage) public userCoverage;
    mapping(uint256 => Claim) public claims;
    mapping(uint256 => InsuranceEvent) public insuranceEvents;
    mapping(address => uint256[]) public userClaimIds;

    // Counters
    uint256 public nextClaimId = 1;
    uint256 public nextEventId = 1;

    // Events
    event CoverageAdded(address indexed user, uint256 amount, uint256 premium);
    event CoverageRemoved(address indexed user);
    event YieldAllocated(uint256 amount);
    event ClaimSubmitted(
        uint256 indexed claimId,
        address indexed claimant,
        uint256 amount,
        string reason
    );
    event ClaimProcessed(uint256 indexed claimId, ClaimStatus status);
    event ClaimPaid(
        uint256 indexed claimId,
        address indexed claimant,
        uint256 amount
    );
    event InsuranceEventCreated(
        uint256 indexed eventId,
        string eventType,
        string description
    );
    event InsuranceEventResolved(uint256 indexed eventId);

    /**
     * @dev Constructor initializes the contract with token address and admin
     * @param _lstBtcToken Address of the lstBTC token
     */
    constructor(address _lstBtcToken) {
        require(_lstBtcToken != address(0), "Invalid token address");
        lstBtcToken = IERC20(_lstBtcToken);

        // Grant admin roles to the deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Add insurance coverage for a user
     * @param user Address of the user to cover
     * @param amount Amount to be covered
     * @param duration Duration of coverage (0 for indefinite)
     */
    function addCoverage(
        address user,
        uint256 amount,
        uint256 duration
    ) external nonReentrant {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || msg.sender == user,
            "Not authorized"
        );
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= maxCoverageAmount, "Amount exceeds maximum coverage");

        // Calculate premium based on the amount
        uint256 premium = (amount * premiumPercentage) / 100;
        require(premium > 0, "Premium too small");

        // Transfer premium from user to contract
        require(
            lstBtcToken.transferFrom(user, address(this), premium),
            "Premium transfer failed"
        );

        // Update insurance reserve
        totalInsuranceReserve += premium;
        totalCoveredAmount += amount;

        // Set up coverage
        userCoverage[user] = Coverage({
            coveredAmount: amount,
            startTime: block.timestamp,
            endTime: duration > 0 ? block.timestamp + duration : 0,
            active: true
        });

        emit CoverageAdded(user, amount, premium);
    }

    /**
     * @dev Remove insurance coverage for a user
     * @param user Address of the user whose coverage should be removed
     */
    function removeCoverage(address user) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || msg.sender == user,
            "Not authorized"
        );
        require(userCoverage[user].active, "No active coverage");

        // Update total covered amount
        totalCoveredAmount -= userCoverage[user].coveredAmount;

        // Deactivate coverage
        userCoverage[user].active = false;

        emit CoverageRemoved(user);
    }

    /**
     * @dev Allocate yield to the insurance pool
     * @param amount Amount of lstBTC to add to the insurance reserve
     */
    function allocateYield(uint256 amount) external nonReentrant {
        require(
            hasRole(YIELD_PROVIDER_ROLE, msg.sender),
            "Not a yield provider"
        );
        require(amount > 0, "Amount must be greater than 0");

        // Transfer yield from provider to contract
        require(
            lstBtcToken.transferFrom(msg.sender, address(this), amount),
            "Yield transfer failed"
        );

        // Update insurance reserve
        totalInsuranceReserve += amount;

        emit YieldAllocated(amount);
    }

    /**
     * @dev Submit an insurance claim
     * @param amount Amount to claim
     * @param reason Reason for the claim
     */
    function submitClaim(
        uint256 amount,
        string calldata reason
    ) external nonReentrant {
        require(userCoverage[msg.sender].active, "No active coverage");
        require(
            block.timestamp < userCoverage[msg.sender].endTime ||
                userCoverage[msg.sender].endTime == 0,
            "Coverage expired"
        );
        require(
            amount <= userCoverage[msg.sender].coveredAmount,
            "Claim exceeds coverage"
        );
        require(amount <= totalInsuranceReserve, "Claim exceeds reserve");
        require(bytes(reason).length > 0, "Reason required");

        // Create new claim
        uint256 claimId = nextClaimId++;
        claims[claimId] = Claim({
            claimId: claimId,
            claimant: msg.sender,
            amount: amount,
            reason: reason,
            submissionTime: block.timestamp,
            status: ClaimStatus.Pending,
            processingTime: 0,
            rejectionReason: ""
        });

        // Add claim to user's claims
        userClaimIds[msg.sender].push(claimId);

        emit ClaimSubmitted(claimId, msg.sender, amount, reason);
    }

    /**
     * @dev Process an insurance claim (approve or reject)
     * @param claimId ID of the claim to process
     * @param approve Whether to approve or reject the claim
     * @param rejectionReason Reason for rejection if applicable
     */
    function processClaim(
        uint256 claimId,
        bool approve,
        string calldata rejectionReason
    ) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(ORACLE_ROLE, msg.sender),
            "Not authorized"
        );
        require(
            claims[claimId].status == ClaimStatus.Pending,
            "Claim not pending"
        );
        require(
            block.timestamp >=
                claims[claimId].submissionTime + claimWaitingPeriod,
            "Waiting period not elapsed"
        );

        if (approve) {
            // Set claim status to approved
            claims[claimId].status = ClaimStatus.Approved;
        } else {
            // Set claim status to rejected with reason
            claims[claimId].status = ClaimStatus.Rejected;
            claims[claimId].rejectionReason = rejectionReason;
        }

        claims[claimId].processingTime = block.timestamp;

        emit ClaimProcessed(claimId, claims[claimId].status);
    }

    /**
     * @dev Pay out an approved claim
     * @param claimId ID of the claim to pay
     */
    function payClaim(uint256 claimId) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        require(
            claims[claimId].status == ClaimStatus.Approved,
            "Claim not approved"
        );

        address claimant = claims[claimId].claimant;
        uint256 amount = claims[claimId].amount;

        // Ensure there's enough in the reserve
        require(amount <= totalInsuranceReserve, "Insufficient reserve");

        // Update claim status
        claims[claimId].status = ClaimStatus.Paid;

        // Update insurance reserve and total claims paid
        totalInsuranceReserve -= amount;
        totalClaimsPaid += amount;

        // Transfer funds to claimant
        require(
            lstBtcToken.transfer(claimant, amount),
            "Payment transfer failed"
        );

        emit ClaimPaid(claimId, claimant, amount);
    }

    /**
     * @dev Create an insurance event (e.g., market crash, hack)
     * @param eventType Type of event
     * @param description Description of the event
     */
    function createInsuranceEvent(
        string calldata eventType,
        string calldata description
    ) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(ORACLE_ROLE, msg.sender),
            "Not authorized"
        );

        uint256 eventId = nextEventId++;
        insuranceEvents[eventId] = InsuranceEvent({
            eventId: eventId,
            eventType: eventType,
            timestamp: block.timestamp,
            resolved: false,
            description: description
        });

        emit InsuranceEventCreated(eventId, eventType, description);
    }

    /**
     * @dev Resolve an insurance event
     * @param eventId ID of the event to resolve
     */
    function resolveInsuranceEvent(uint256 eventId) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        require(!insuranceEvents[eventId].resolved, "Event already resolved");

        insuranceEvents[eventId].resolved = true;

        emit InsuranceEventResolved(eventId);
    }

    /**
     * @dev Update coverage percentage
     * @param newPercentage New coverage percentage
     */
    function updateCoveragePercentage(uint256 newPercentage) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        require(
            newPercentage > 0 && newPercentage <= 100,
            "Invalid percentage"
        );

        coveragePercentage = newPercentage;
    }

    /**
     * @dev Update premium percentage
     * @param newPercentage New premium percentage
     */
    function updatePremiumPercentage(uint256 newPercentage) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        require(newPercentage > 0 && newPercentage <= 50, "Invalid percentage");

        premiumPercentage = newPercentage;
    }

    /**
     * @dev Update claim waiting period
     * @param newPeriod New waiting period in seconds
     */
    function updateClaimWaitingPeriod(uint256 newPeriod) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");

        claimWaitingPeriod = newPeriod;
    }

    /**
     * @dev Update maximum coverage amount per user
     * @param newMax New maximum amount
     */
    function updateMaxCoverageAmount(uint256 newMax) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        require(newMax > 0, "Invalid amount");

        maxCoverageAmount = newMax;
    }

    /**
     * @dev Add an address to a role
     * @param role Role to add the address to
     * @param account Address to add to the role
     */
    function addRole(bytes32 role, address account) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not default admin");
        grantRole(role, account);
    }

    /**
     * @dev Remove an address from a role
     * @param role Role to remove the address from
     * @param account Address to remove from the role
     */
    function removeRole(bytes32 role, address account) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not default admin");
        revokeRole(role, account);
    }

    /**
     * @dev Get all claim IDs for a user
     * @param user Address of the user
     * @return Array of claim IDs
     */
    function getUserClaimIds(
        address user
    ) external view returns (uint256[] memory) {
        return userClaimIds[user];
    }

    function getPoolStats()
        external
        view
        returns (
            uint256 reserve,
            uint256 covered,
            uint256 claimsPaid,
            uint256 claimCount
        )
    {
        return (
            totalInsuranceReserve,
            totalCoveredAmount,
            totalClaimsPaid,
            nextClaimId - 1
        );
    }

    /**
     * @dev Check if a user has active coverage
     * @param user Address of the user to check
     * @return Whether the user has active coverage
     */
    function hasCoverage(address user) external view returns (bool) {
        Coverage memory coverage = userCoverage[user];
        return
            coverage.active &&
            (coverage.endTime == 0 || block.timestamp < coverage.endTime);
    }

    /**
     * @dev Emergency withdraw function for admin
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     */
    function emergencyWithdraw(uint256 amount, address recipient) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not default admin");
        require(recipient != address(0), "Invalid recipient");
        require(amount <= totalInsuranceReserve, "Amount exceeds reserve");

        totalInsuranceReserve -= amount;
        require(lstBtcToken.transfer(recipient, amount), "Transfer failed");
    }
}
