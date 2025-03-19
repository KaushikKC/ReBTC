// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title InsurancePool
 * @dev A contract that allows users to apply for insurance with liquidation and slashing protection
 */
contract InsurancePool {
    // Contract owner/admin
    address public admin;

    // Insurance application status
    enum ApplicationStatus {
        Pending,
        Approved,
        Rejected,
        Active,
        Repaid,
        Defaulted
    }

    // Insurance types
    enum InsuranceType {
        General,
        LiquidationProtection,
        SlashingProtection
    }

    // Interest rate tiers (annual percentage rate * 100 for precision)
    // e.g., 500 = 5.00%, 1000 = 10.00%
    struct InterestTier {
        uint256 minDuration; // in days
        uint256 maxDuration; // in days
        uint256 rate; // APR * 100
    }

    // Insurance application structure
    struct InsuranceApplication {
        address applicant;
        uint256 coverageAmount;
        string coverageDetails;
        uint256 timestamp;
        ApplicationStatus status;
        InsuranceType insuranceType;
        uint256 duration; // in days
        uint256 interestRate; // APR * 100
        uint256 totalAmountDue; // including interest
        uint256 repaymentDeadline; // timestamp
        uint256 amountRepaid; // amount already repaid
    }

    // Mapping from application ID to application details
    mapping(uint256 => InsuranceApplication) public applications;

    // Mapping from user address to their application IDs
    mapping(address => uint256[]) public userApplications;

    // Interest rate tiers
    InterestTier[] public interestTiers;

    // Total number of applications
    uint256 public applicationCount;

    // Contract balance
    uint256 public poolBalance;

    // Events
    event ApplicationSubmitted(
        uint256 indexed applicationId,
        address indexed applicant,
        uint256 coverageAmount,
        InsuranceType insuranceType
    );
    event ApplicationStatusChanged(
        uint256 indexed applicationId,
        ApplicationStatus status
    );
    event InsurancePaid(
        uint256 indexed applicationId,
        address indexed recipient,
        uint256 amount
    );
    event FundsDeposited(address indexed from, uint256 amount);
    event RepaymentReceived(
        uint256 indexed applicationId,
        address indexed from,
        uint256 amount
    );
    event InsuranceActivated(
        uint256 indexed applicationId,
        uint256 totalAmountDue,
        uint256 repaymentDeadline
    );
    event LiquidationProtectionTriggered(
        uint256 indexed applicationId,
        address indexed user,
        uint256 amount
    );
    event SlashingProtectionTriggered(
        uint256 indexed applicationId,
        address indexed user,
        uint256 amount
    );

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    /**
     * @dev Constructor sets the contract admin and default interest tiers
     */
    constructor() {
        admin = msg.sender;
        applicationCount = 0;

        // Set up default interest tiers
        interestTiers.push(
            InterestTier({minDuration: 1, maxDuration: 30, rate: 500})
        ); // 5% for 1-30 days
        interestTiers.push(
            InterestTier({minDuration: 31, maxDuration: 90, rate: 800})
        ); // 8% for 31-90 days
        interestTiers.push(
            InterestTier({minDuration: 91, maxDuration: 180, rate: 1000})
        ); // 10% for 91-180 days
        interestTiers.push(
            InterestTier({minDuration: 181, maxDuration: 365, rate: 1200})
        ); // 12% for 181-365 days
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
    ) external {
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 interestRate = getInterestRate(_duration);

        uint256 applicationId = applicationCount;

        applications[applicationId] = InsuranceApplication({
            applicant: msg.sender,
            coverageAmount: _coverageAmount,
            coverageDetails: _coverageDetails,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            insuranceType: InsuranceType.General,
            duration: _duration,
            interestRate: interestRate,
            totalAmountDue: 0, // Will be calculated when approved
            repaymentDeadline: 0, // Will be set when approved
            amountRepaid: 0
        });

        userApplications[msg.sender].push(applicationId);
        applicationCount++;

        emit ApplicationSubmitted(
            applicationId,
            msg.sender,
            _coverageAmount,
            InsuranceType.General
        );
    }

    /**
     * @dev Allows users to apply for liquidation protection insurance
     * @param _coverageAmount The amount of coverage requested
     * @param _coverageDetails Details about the position being protected
     * @param _duration Duration of insurance in days
     */
    function applyForLiquidationProtection(
        uint256 _coverageAmount,
        string memory _coverageDetails,
        uint256 _duration
    ) external {
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 interestRate = getInterestRate(_duration);
        // Liquidation protection has a premium of 2% on top of the base rate
        interestRate += 200;

        uint256 applicationId = applicationCount;

        applications[applicationId] = InsuranceApplication({
            applicant: msg.sender,
            coverageAmount: _coverageAmount,
            coverageDetails: _coverageDetails,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            insuranceType: InsuranceType.LiquidationProtection,
            duration: _duration,
            interestRate: interestRate,
            totalAmountDue: 0, // Will be calculated when approved
            repaymentDeadline: 0, // Will be set when approved
            amountRepaid: 0
        });

        userApplications[msg.sender].push(applicationId);
        applicationCount++;

        emit ApplicationSubmitted(
            applicationId,
            msg.sender,
            _coverageAmount,
            InsuranceType.LiquidationProtection
        );
    }

    /**
     * @dev Allows users to apply for slashing protection insurance
     * @param _coverageAmount The amount of coverage requested
     * @param _coverageDetails Details about the staking position being protected
     * @param _duration Duration of insurance in days
     */
    function applyForSlashingProtection(
        uint256 _coverageAmount,
        string memory _coverageDetails,
        uint256 _duration
    ) external {
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 interestRate = getInterestRate(_duration);
        // Slashing protection has a premium of 3% on top of the base rate
        interestRate += 300;

        uint256 applicationId = applicationCount;

        applications[applicationId] = InsuranceApplication({
            applicant: msg.sender,
            coverageAmount: _coverageAmount,
            coverageDetails: _coverageDetails,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            insuranceType: InsuranceType.SlashingProtection,
            duration: _duration,
            interestRate: interestRate,
            totalAmountDue: 0, // Will be calculated when approved
            repaymentDeadline: 0, // Will be set when approved
            amountRepaid: 0
        });

        userApplications[msg.sender].push(applicationId);
        applicationCount++;

        emit ApplicationSubmitted(
            applicationId,
            msg.sender,
            _coverageAmount,
            InsuranceType.SlashingProtection
        );
    }

    /**
     * @dev Allows admin to approve an insurance application
     * @param _applicationId The ID of the application to approve
     */
    function approveApplication(uint256 _applicationId) external onlyAdmin {
        require(_applicationId < applicationCount, "Invalid application ID");
        require(
            applications[_applicationId].status == ApplicationStatus.Pending,
            "Application is not pending"
        );

        InsuranceApplication storage application = applications[_applicationId];
        application.status = ApplicationStatus.Approved;

        emit ApplicationStatusChanged(
            _applicationId,
            ApplicationStatus.Approved
        );
    }

    /**
     * @dev Allows admin to reject an insurance application
     * @param _applicationId The ID of the application to reject
     */
    function rejectApplication(uint256 _applicationId) external onlyAdmin {
        require(_applicationId < applicationCount, "Invalid application ID");
        require(
            applications[_applicationId].status == ApplicationStatus.Pending,
            "Application is not pending"
        );

        applications[_applicationId].status = ApplicationStatus.Rejected;

        emit ApplicationStatusChanged(
            _applicationId,
            ApplicationStatus.Rejected
        );
    }

    /**
     * @dev Allows admin to activate an approved insurance policy
     * @param _applicationId The ID of the approved application
     */
    function activateInsurance(uint256 _applicationId) external onlyAdmin {
        require(_applicationId < applicationCount, "Invalid application ID");
        require(
            applications[_applicationId].status == ApplicationStatus.Approved,
            "Application is not approved"
        );

        InsuranceApplication storage application = applications[_applicationId];

        // Calculate total amount due with interest
        uint256 interest = (application.coverageAmount *
            application.interestRate *
            application.duration) / (365 * 10000);
        application.totalAmountDue = application.coverageAmount + interest;

        // Set repayment deadline
        application.repaymentDeadline =
            block.timestamp +
            (application.duration * 1 days);

        // Update status
        application.status = ApplicationStatus.Active;

        // Transfer the coverage amount to the applicant
        require(
            poolBalance >= application.coverageAmount,
            "Insufficient funds in the pool"
        );
        poolBalance -= application.coverageAmount;

        (bool success, ) = application.applicant.call{
            value: application.coverageAmount
        }("");
        require(success, "Transfer failed");

        emit InsurancePaid(
            _applicationId,
            application.applicant,
            application.coverageAmount
        );
        emit InsuranceActivated(
            _applicationId,
            application.totalAmountDue,
            application.repaymentDeadline
        );
    }

    /**
     * @dev Allows users to repay their insurance
     * @param _applicationId The ID of the active insurance
     */
    function repayInsurance(uint256 _applicationId) external payable {
        require(_applicationId < applicationCount, "Invalid application ID");

        InsuranceApplication storage application = applications[_applicationId];

        require(
            application.status == ApplicationStatus.Active,
            "Insurance is not active"
        );
        require(
            msg.sender == application.applicant,
            "Only the applicant can repay"
        );

        uint256 remainingAmount = application.totalAmountDue -
            application.amountRepaid;
        require(
            msg.value > 0 && msg.value <= remainingAmount,
            "Invalid repayment amount"
        );

        application.amountRepaid += msg.value;
        poolBalance += msg.value;

        emit RepaymentReceived(_applicationId, msg.sender, msg.value);

        // Check if fully repaid
        if (application.amountRepaid >= application.totalAmountDue) {
            application.status = ApplicationStatus.Repaid;
            emit ApplicationStatusChanged(
                _applicationId,
                ApplicationStatus.Repaid
            );
        }
    }

    /**
     * @dev Allows admin to mark an insurance as defaulted
     * @param _applicationId The ID of the active insurance
     */
    function markAsDefaulted(uint256 _applicationId) external onlyAdmin {
        require(_applicationId < applicationCount, "Invalid application ID");

        InsuranceApplication storage application = applications[_applicationId];

        require(
            application.status == ApplicationStatus.Active,
            "Insurance is not active"
        );
        require(
            block.timestamp > application.repaymentDeadline,
            "Repayment deadline not passed"
        );

        application.status = ApplicationStatus.Defaulted;

        emit ApplicationStatusChanged(
            _applicationId,
            ApplicationStatus.Defaulted
        );
    }

    /**
     * @dev Triggers liquidation protection for a user
     * @param _applicationId The ID of the active insurance
     * @param _liquidationAmount The amount needed to prevent liquidation
     */
    function triggerLiquidationProtection(
        uint256 _applicationId,
        uint256 _liquidationAmount
    ) external {
        require(_applicationId < applicationCount, "Invalid application ID");

        InsuranceApplication storage application = applications[_applicationId];

        require(
            application.status == ApplicationStatus.Active,
            "Insurance is not active"
        );
        require(
            application.insuranceType == InsuranceType.LiquidationProtection,
            "Not a liquidation protection insurance"
        );
        require(
            msg.sender == application.applicant,
            "Only the applicant can trigger protection"
        );
        require(
            _liquidationAmount <= application.coverageAmount,
            "Amount exceeds coverage"
        );

        // Transfer the liquidation amount to the applicant
        require(
            poolBalance >= _liquidationAmount,
            "Insufficient funds in the pool"
        );
        poolBalance -= _liquidationAmount;

        (bool success, ) = application.applicant.call{
            value: _liquidationAmount
        }("");
        require(success, "Transfer failed");

        // Update the total amount due to include the liquidation amount
        application.totalAmountDue += _liquidationAmount;

        emit LiquidationProtectionTriggered(
            _applicationId,
            application.applicant,
            _liquidationAmount
        );
    }

    /**
     * @dev Triggers slashing protection for a user
     * @param _applicationId The ID of the active insurance
     * @param _slashAmount The amount that was slashed
     */
    function triggerSlashingProtection(
        uint256 _applicationId,
        uint256 _slashAmount
    ) external {
        require(_applicationId < applicationCount, "Invalid application ID");

        InsuranceApplication storage application = applications[_applicationId];

        require(
            application.status == ApplicationStatus.Active,
            "Insurance is not active"
        );
        require(
            application.insuranceType == InsuranceType.SlashingProtection,
            "Not a slashing protection insurance"
        );
        require(
            msg.sender == application.applicant,
            "Only the applicant can trigger protection"
        );
        require(
            _slashAmount <= application.coverageAmount,
            "Amount exceeds coverage"
        );

        // Transfer the slashed amount to the applicant
        require(poolBalance >= _slashAmount, "Insufficient funds in the pool");
        poolBalance -= _slashAmount;

        (bool success, ) = application.applicant.call{value: _slashAmount}("");
        require(success, "Transfer failed");

        // Update the total amount due to include the slashed amount
        application.totalAmountDue += _slashAmount;

        emit SlashingProtectionTriggered(
            _applicationId,
            application.applicant,
            _slashAmount
        );
    }

    /**
     * @dev Returns the interest rate for a given duration
     * @param _duration Duration in days
     * @return Interest rate (APR * 100)
     */
    function getInterestRate(uint256 _duration) public view returns (uint256) {
        for (uint256 i = 0; i < interestTiers.length; i++) {
            if (
                _duration >= interestTiers[i].minDuration &&
                _duration <= interestTiers[i].maxDuration
            ) {
                return interestTiers[i].rate;
            }
        }

        // Default to the highest tier if duration exceeds all tiers
        return interestTiers[interestTiers.length - 1].rate;
    }

    /**
     * @dev Allows admin to add or update an interest tier
     * @param _minDuration Minimum duration in days
     * @param _maxDuration Maximum duration in days
     * @param _rate Interest rate (APR * 100)
     * @param _index Index to update, or interestTiers.length to add new
     */
    function setInterestTier(
        uint256 _minDuration,
        uint256 _maxDuration,
        uint256 _rate,
        uint256 _index
    ) external onlyAdmin {
        require(
            _minDuration <= _maxDuration,
            "Min duration must be <= max duration"
        );

        if (_index < interestTiers.length) {
            // Update existing tier
            interestTiers[_index] = InterestTier({
                minDuration: _minDuration,
                maxDuration: _maxDuration,
                rate: _rate
            });
        } else if (_index == interestTiers.length) {
            // Add new tier
            interestTiers.push(
                InterestTier({
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
     * @dev Allows anyone to deposit funds into the insurance pool
     */
    function depositToPool() external payable {
        require(msg.value > 0, "Must deposit some amount");
        poolBalance += msg.value;

        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Allows admin to withdraw funds from the pool
     * @param _amount The amount to withdraw
     */
    function withdrawFromPool(uint256 _amount) external onlyAdmin {
        require(_amount <= poolBalance, "Insufficient funds in the pool");

        poolBalance -= _amount;

        (bool success, ) = admin.call{value: _amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Returns all application IDs for a specific user
     * @param _user The address of the user
     * @return An array of application IDs
     */
    function getUserApplications(
        address _user
    ) external view returns (uint256[] memory) {
        return userApplications[_user];
    }

    /**
     * @dev Returns the details of a specific application
     * @param _applicationId The ID of the application
     * @return applicant The address of the applicant
     * @return coverageAmount The amount of coverage requested
     * @return coverageDetails Details about what is being insured
     * @return timestamp The time when the application was submitted
     * @return status The current status of the application
     * @return insuranceType The type of insurance
     * @return duration The duration of insurance in days
     * @return interestRate The interest rate applied (APR * 100)
     * @return totalAmountDue The total amount due including interest
     * @return repaymentDeadline The deadline for repayment
     * @return amountRepaid The amount already repaid
     */
    function getApplicationDetails(
        uint256 _applicationId
    )
        external
        view
        returns (
            address applicant,
            uint256 coverageAmount,
            string memory coverageDetails,
            uint256 timestamp,
            ApplicationStatus status,
            InsuranceType insuranceType,
            uint256 duration,
            uint256 interestRate,
            uint256 totalAmountDue,
            uint256 repaymentDeadline,
            uint256 amountRepaid
        )
    {
        require(_applicationId < applicationCount, "Invalid application ID");

        InsuranceApplication storage application = applications[_applicationId];

        return (
            application.applicant,
            application.coverageAmount,
            application.coverageDetails,
            application.timestamp,
            application.status,
            application.insuranceType,
            application.duration,
            application.interestRate,
            application.totalAmountDue,
            application.repaymentDeadline,
            application.amountRepaid
        );
    }

    /**
     * @dev Returns the number of interest tiers
     * @return The count of interest tiers
     */
    function getInterestTiersCount() external view returns (uint256) {
        return interestTiers.length;
    }

    /**
     * @dev Allows the admin to transfer admin rights to another address
     * @param _newAdmin The address of the new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(
            _newAdmin != address(0),
            "New admin cannot be the zero address"
        );
        admin = _newAdmin;
    }

    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {
        poolBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
}
