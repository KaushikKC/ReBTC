// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title BTCInsurancePool
 * @dev Contract for providing general insurance protection for lstBTC holders
 */
contract BTCInsurancePool is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public lstBTCToken; // lstBTC token from Yield Vault

    // Insurance application status
    enum ApplicationStatus {
        Pending,
        Approved,
        Rejected,
        Active,
        Expired,
        Claimed
    }

    // Premium rate tiers (annual percentage rate * 100 for precision)
    // e.g., 500 = 5.00%, 1000 = 10.00%
    struct PremiumTier {
        uint256 minDuration; // in days
        uint256 maxDuration; // in days
        uint256 rate; // APR * 100
    }

    // Insurance policy structure
    struct InsurancePolicy {
        address policyholder;
        uint256 coverageAmount;
        string coverageDetails;
        uint256 timestamp;
        ApplicationStatus status;
        uint256 duration; // in days
        uint256 premium; // Premium amount in lstBTC
        uint256 premiumRate; // Premium rate * 100
        uint256 expirationTimestamp; // When policy expires
        bool claimed; // Whether policy has been claimed
    }

    // Mapping from policy ID to policy details
    mapping(uint256 => InsurancePolicy) public policies;

    // Mapping from user address to their policy IDs
    mapping(address => uint256[]) public userPolicies;

    // Premium rate tiers
    PremiumTier[] public premiumTiers;

    // Total number of policies
    uint256 public policyCount;

    // Contract token balance
    uint256 public poolBalance;

    // Minimum coverage ratio (pool balance to total coverage)
    uint256 public minCoverageRatio = 2000; // 20% (scaled by 10000)

    // Maximum coverage per policy
    uint256 public maxCoveragePerPolicy;

    // Events
    event PolicyApplicationSubmitted(
        uint256 indexed policyId,
        address indexed applicant,
        uint256 coverageAmount
    );
    event PolicyStatusChanged(
        uint256 indexed policyId,
        ApplicationStatus status
    );
    event PremiumPaid(
        uint256 indexed policyId,
        address indexed policyholder,
        uint256 amount
    );
    event PolicyActivated(
        uint256 indexed policyId,
        uint256 expirationTimestamp
    );
    event ClaimPaid(
        uint256 indexed policyId,
        address indexed recipient,
        uint256 amount
    );
    event FundsDeposited(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    /**
     * @dev Constructor sets the contract owner, token address, and default premium tiers
     * @param _lstBTCToken The address of the lstBTC token contract
     */
    constructor(address _lstBTCToken) Ownable(msg.sender) {
        require(_lstBTCToken != address(0), "Token address cannot be zero");

        lstBTCToken = IERC20(_lstBTCToken);
        policyCount = 0;

        // Set up default premium tiers
        premiumTiers.push(
            PremiumTier({minDuration: 1, maxDuration: 30, rate: 500})
        ); // 5% for 1-30 days
        premiumTiers.push(
            PremiumTier({minDuration: 31, maxDuration: 90, rate: 800})
        ); // 8% for 31-90 days
        premiumTiers.push(
            PremiumTier({minDuration: 91, maxDuration: 180, rate: 1000})
        ); // 10% for 91-180 days
        premiumTiers.push(
            PremiumTier({minDuration: 181, maxDuration: 365, rate: 1200})
        ); // 12% for 181-365 days

        // Set initial max coverage per policy (can be updated by owner)
        maxCoveragePerPolicy = 100 * 1e18; // 100 lstBTC
    }

    /**
     * @dev Allows users to apply for general insurance
     * @param _coverageAmount The amount of coverage requested
     * @param _coverageDetails Details about what is being insured
     * @param _duration Duration of insurance in days
     */
    function applyForInsurance(
        uint256 _coverageAmount,
        string memory _coverageDetails,
        uint256 _duration
    ) external nonReentrant {
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(
            _coverageAmount <= maxCoveragePerPolicy,
            "Coverage exceeds maximum allowed"
        );
        require(_duration > 0, "Duration must be greater than 0");

        uint256 premiumRate = getPremiumRate(_duration);
        uint256 premium = calculatePremium(
            _coverageAmount,
            premiumRate,
            _duration
        );

        uint256 policyId = policyCount;

        policies[policyId] = InsurancePolicy({
            policyholder: msg.sender,
            coverageAmount: _coverageAmount,
            coverageDetails: _coverageDetails,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            duration: _duration,
            premium: premium,
            premiumRate: premiumRate,
            expirationTimestamp: 0, // Will be set when activated
            claimed: false
        });

        userPolicies[msg.sender].push(policyId);
        policyCount++;

        emit PolicyApplicationSubmitted(policyId, msg.sender, _coverageAmount);
    }

    /**
     * @dev Allows owner to approve an insurance application
     * @param _policyId The ID of the application to approve
     */
    function approvePolicy(uint256 _policyId) external onlyOwner {
        require(_policyId < policyCount, "Invalid policy ID");
        require(
            policies[_policyId].status == ApplicationStatus.Pending,
            "Policy is not pending"
        );

        InsurancePolicy storage policy = policies[_policyId];
        policy.status = ApplicationStatus.Approved;

        emit PolicyStatusChanged(_policyId, ApplicationStatus.Approved);
    }

    /**
     * @dev Allows owner to reject an insurance application
     * @param _policyId The ID of the application to reject
     */
    function rejectPolicy(uint256 _policyId) external onlyOwner {
        require(_policyId < policyCount, "Invalid policy ID");
        require(
            policies[_policyId].status == ApplicationStatus.Pending,
            "Policy is not pending"
        );

        policies[_policyId].status = ApplicationStatus.Rejected;

        emit PolicyStatusChanged(_policyId, ApplicationStatus.Rejected);
    }

    /**
     * @dev Allows users to pay premium and activate an approved policy
     * @param _policyId The ID of the approved policy
     */
    function payPremiumAndActivate(uint256 _policyId) external nonReentrant {
        require(_policyId < policyCount, "Invalid policy ID");

        InsurancePolicy storage policy = policies[_policyId];

        require(
            policy.status == ApplicationStatus.Approved,
            "Policy is not approved"
        );
        require(
            msg.sender == policy.policyholder,
            "Only policyholder can pay premium"
        );

        // Check if pool has enough capacity for new policy
        uint256 totalCoverage = getTotalActiveCoverage().add(
            policy.coverageAmount
        );
        require(
            poolBalance.mul(10000) >= totalCoverage.mul(minCoverageRatio),
            "Insurance pool undercapitalized"
        );

        // Transfer premium from user to contract
        require(
            lstBTCToken.transferFrom(msg.sender, address(this), policy.premium),
            "Premium payment failed"
        );

        // Update pool balance
        poolBalance = poolBalance.add(policy.premium);

        // Set expiration timestamp
        policy.expirationTimestamp =
            block.timestamp +
            (policy.duration * 1 days);

        // Update status
        policy.status = ApplicationStatus.Active;

        emit PremiumPaid(_policyId, policy.policyholder, policy.premium);

        emit PolicyActivated(_policyId, policy.expirationTimestamp);
    }

    /**
     * @dev Allows policyholder to claim on an insurance policy
     * @param _policyId The ID of the active policy
     * @param _claimAmount The amount to claim
     */
    function claimInsurance(
        uint256 _policyId,
        uint256 _claimAmount
    ) external nonReentrant {
        require(_policyId < policyCount, "Invalid policy ID");

        InsurancePolicy storage policy = policies[_policyId];

        require(
            policy.status == ApplicationStatus.Active,
            "Policy is not active"
        );
        require(
            msg.sender == policy.policyholder,
            "Only the policyholder can claim"
        );
        require(
            block.timestamp < policy.expirationTimestamp,
            "Policy has expired"
        );
        require(!policy.claimed, "Policy has already been claimed");
        require(
            _claimAmount <= policy.coverageAmount,
            "Amount exceeds coverage"
        );

        // Transfer the claim amount to the policyholder
        require(poolBalance >= _claimAmount, "Insufficient funds in the pool");
        poolBalance = poolBalance.sub(_claimAmount);

        require(
            lstBTCToken.transfer(policy.policyholder, _claimAmount),
            "Token transfer failed"
        );

        // Mark policy as claimed
        policy.claimed = true;
        policy.status = ApplicationStatus.Claimed;

        emit ClaimPaid(_policyId, policy.policyholder, _claimAmount);

        emit PolicyStatusChanged(_policyId, ApplicationStatus.Claimed);
    }

    /**
     * @dev Mark expired policies
     * @param _policyId The ID of the policy to check
     */
    function markPolicyAsExpired(uint256 _policyId) external {
        require(_policyId < policyCount, "Invalid policy ID");

        InsurancePolicy storage policy = policies[_policyId];

        require(
            policy.status == ApplicationStatus.Active,
            "Policy is not active"
        );
        require(
            block.timestamp >= policy.expirationTimestamp,
            "Policy has not expired yet"
        );
        require(!policy.claimed, "Policy has already been claimed");

        policy.status = ApplicationStatus.Expired;

        emit PolicyStatusChanged(_policyId, ApplicationStatus.Expired);
    }

    /**
     * @dev Returns the premium rate for a given duration
     * @param _duration Duration in days
     * @return Premium rate (APR * 100)
     */
    function getPremiumRate(uint256 _duration) public view returns (uint256) {
        for (uint256 i = 0; i < premiumTiers.length; i++) {
            if (
                _duration >= premiumTiers[i].minDuration &&
                _duration <= premiumTiers[i].maxDuration
            ) {
                return premiumTiers[i].rate;
            }
        }

        // Default to the highest tier if duration exceeds all tiers
        return premiumTiers[premiumTiers.length - 1].rate;
    }

    /**
     * @dev Calculate premium amount based on coverage, rate and duration
     * @param _coverageAmount Amount of coverage
     * @param _premiumRate Premium rate (APR * 100)
     * @param _duration Duration in days
     * @return Premium amount in lstBTC
     */
    function calculatePremium(
        uint256 _coverageAmount,
        uint256 _premiumRate,
        uint256 _duration
    ) public pure returns (uint256) {
        return
            _coverageAmount.mul(_premiumRate).mul(_duration).div(365 * 10000);
    }

    /**
     * @dev Allows owner to add or update a premium tier
     * @param _minDuration Minimum duration in days
     * @param _maxDuration Maximum duration in days
     * @param _rate Premium rate (APR * 100)
     * @param _index Index to update, or premiumTiers.length to add new
     */
    function setPremiumTier(
        uint256 _minDuration,
        uint256 _maxDuration,
        uint256 _rate,
        uint256 _index
    ) external onlyOwner {
        require(
            _minDuration <= _maxDuration,
            "Min duration must be <= max duration"
        );

        if (_index < premiumTiers.length) {
            // Update existing tier
            premiumTiers[_index] = PremiumTier({
                minDuration: _minDuration,
                maxDuration: _maxDuration,
                rate: _rate
            });
        } else if (_index == premiumTiers.length) {
            // Add new tier
            premiumTiers.push(
                PremiumTier({
                    minDuration: _minDuration,
                    maxDuration: _maxDuration,
                    rate: _rate
                })
            );
        } else {
            revert("Invalid index");
        }
    }

    /**
     * @dev Allows anyone to deposit tokens into the insurance pool
     * @param _amount The amount of tokens to deposit
     */
    function depositToPool(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Must deposit some amount");

        // Transfer tokens from user to contract
        require(
            lstBTCToken.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        poolBalance = poolBalance.add(_amount);

        emit FundsDeposited(msg.sender, _amount);
    }

    /**
     * @dev Allows owner to withdraw tokens from the pool
     * @param _amount The amount to withdraw
     */
    function withdrawFromPool(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount <= poolBalance, "Insufficient funds in the pool");

        // Check if withdrawal would violate minimum coverage ratio
        uint256 totalCoverage = getTotalActiveCoverage();
        require(
            totalCoverage == 0 ||
                (poolBalance.sub(_amount)).mul(10000) >=
                totalCoverage.mul(minCoverageRatio),
            "Withdrawal would undercapitalize the pool"
        );

        poolBalance = poolBalance.sub(_amount);

        require(
            lstBTCToken.transfer(owner(), _amount),
            "Token transfer failed"
        );

        emit FundsWithdrawn(owner(), _amount);
    }

    /**
     * @dev Returns all policy IDs for a specific user
     * @param _user The address of the user
     * @return An array of policy IDs
     */
    function getUserPolicies(
        address _user
    ) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    /**
     * @dev Returns the total coverage amount for all active policies
     * @return Total coverage amount
     */
    function getTotalActiveCoverage() public view returns (uint256) {
        uint256 totalCoverage = 0;

        for (uint256 i = 0; i < policyCount; i++) {
            InsurancePolicy storage policy = policies[i];
            if (
                policy.status == ApplicationStatus.Active &&
                !policy.claimed &&
                block.timestamp < policy.expirationTimestamp
            ) {
                totalCoverage = totalCoverage.add(policy.coverageAmount);
            }
        }

        return totalCoverage;
    }

    /**
     * @dev Returns the number of premium tiers
     * @return The count of premium tiers
     */
    function getPremiumTiersCount() external view returns (uint256) {
        return premiumTiers.length;
    }

    /**
     * @dev Set the minimum coverage ratio
     * @param _minCoverageRatio New minimum coverage ratio (scaled by 10000)
     */
    function setMinCoverageRatio(uint256 _minCoverageRatio) external onlyOwner {
        require(_minCoverageRatio > 0, "Coverage ratio must be greater than 0");
        minCoverageRatio = _minCoverageRatio;
    }

    /**
     * @dev Set the maximum coverage per policy
     * @param _maxCoveragePerPolicy New maximum coverage per policy
     */
    function setMaxCoveragePerPolicy(
        uint256 _maxCoveragePerPolicy
    ) external onlyOwner {
        require(
            _maxCoveragePerPolicy > 0,
            "Max coverage must be greater than 0"
        );
        maxCoveragePerPolicy = _maxCoveragePerPolicy;
    }

    /**
     * @dev Returns the token balance of the contract
     * @return The token balance
     */
    function getContractTokenBalance() external view returns (uint256) {
        return lstBTCToken.balanceOf(address(this));
    }
}
