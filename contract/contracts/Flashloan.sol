// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IFlashLoanReceiver
 * @dev Interface for flash loan borrowers
 */
interface IFlashLoanReceiver {
    function executeOperation(
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @title LstBtcFlashLoan
 * @dev Provides flash loans for lstBTC holders to access instant liquidity
 * Uses an internal liquidity pool and enforces repayment in the same transaction
 */
contract LstBtcFlashLoan is ReentrancyGuard, Ownable {
    // The lstBTC token contract
    IERC20 public lstBtcToken;

    // Fee in basis points (e.g., 30 = 0.3%)
    uint256 public flashLoanFeeInBps = 30;

    // Minimum and maximum flash loan amounts
    uint256 public minFlashLoanAmount = 0.01 ether; // Assuming 18 decimals
    uint256 public maxFlashLoanPercentage = 80; // 80% of available liquidity

    // Total fees collected
    uint256 public totalFeesCollected;

    // AMM liquidity pool tracking
    uint256 public totalLiquidity;

    // Events
    event FlashLoanBorrowed(
        address indexed borrower,
        uint256 amount,
        uint256 fee
    );
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // Mapping for liquidity providers
    mapping(address => uint256) public liquidityProviders;

    constructor(address _owner, address _tokenAddress) Ownable(_owner) {
        lstBtcToken = IERC20(_tokenAddress);
    }

    /**
     * @dev Adds liquidity to the flash loan pool
     * @param amount Amount of lstBTC to add as liquidity
     */
    function addLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer lstBTC from the user to this contract
        require(
            lstBtcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Update liquidity provider's balance and total liquidity
        liquidityProviders[msg.sender] += amount;
        totalLiquidity += amount;

        emit LiquidityAdded(msg.sender, amount);
    }

    /**
     * @dev Removes liquidity from the flash loan pool
     * @param amount Amount of lstBTC to remove
     */
    function removeLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            liquidityProviders[msg.sender] >= amount,
            "Insufficient liquidity"
        );

        // Ensure there's enough available liquidity (not being used in active loans)
        require(
            lstBtcToken.balanceOf(address(this)) >= amount,
            "Insufficient contract balance"
        );

        // Update liquidity provider's balance and total liquidity
        liquidityProviders[msg.sender] -= amount;
        totalLiquidity -= amount;

        // Transfer lstBTC back to the user
        require(lstBtcToken.transfer(msg.sender, amount), "Transfer failed");

        emit LiquidityRemoved(msg.sender, amount);
    }

    /**
     * @dev Executes a flash loan
     * @param receiver Address of the contract implementing IFlashLoanReceiver
     * @param amount Amount of lstBTC to borrow
     * @param params Additional parameters to pass to the receiver contract
     */
    function flashLoan(
        address receiver,
        uint256 amount,
        bytes calldata params
    ) external nonReentrant {
        require(amount >= minFlashLoanAmount, "Amount below minimum");

        uint256 availableLiquidity = lstBtcToken.balanceOf(address(this));
        require(amount <= availableLiquidity, "Not enough liquidity");
        require(
            amount <= (availableLiquidity * maxFlashLoanPercentage) / 100,
            "Amount exceeds maximum allowed percentage"
        );

        // Calculate fee
        uint256 fee = (amount * flashLoanFeeInBps) / 10000;

        // Record contract balance before the loan
        uint256 balanceBefore = lstBtcToken.balanceOf(address(this));

        // Transfer lstBTC to the receiver
        require(
            lstBtcToken.transfer(receiver, amount),
            "Transfer to receiver failed"
        );

        // Execute the operation
        require(
            IFlashLoanReceiver(receiver).executeOperation(amount, fee, params),
            "Flash loan execution failed"
        );

        // Ensure the loan plus fee has been repaid
        uint256 balanceAfter = lstBtcToken.balanceOf(address(this));
        require(
            balanceAfter >= balanceBefore + fee,
            "Flash loan not repaid correctly"
        );

        // Update fees collected
        totalFeesCollected += fee;

        emit FlashLoanBorrowed(msg.sender, amount, fee);
    }

    /**
     * @dev Updates the flash loan fee
     * @param newFeeInBps New fee in basis points
     */
    function updateFlashLoanFee(uint256 newFeeInBps) external onlyOwner {
        require(newFeeInBps <= 100, "Fee too high"); // Max 1%

        uint256 oldFee = flashLoanFeeInBps;
        flashLoanFeeInBps = newFeeInBps;

        emit FeeUpdated(oldFee, newFeeInBps);
    }

    /**
     * @dev Withdraws collected fees
     * @param recipient Address to receive the fees
     */
    function withdrawFees(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");

        uint256 feesToWithdraw = totalFeesCollected;
        totalFeesCollected = 0;

        require(
            lstBtcToken.transfer(recipient, feesToWithdraw),
            "Fee transfer failed"
        );
    }

    /**
     * @dev Updates maximum flash loan percentage
     * @param newMaxPercentage New max percentage (1-100)
     */
    function updateMaxLoanPercentage(
        uint256 newMaxPercentage
    ) external onlyOwner {
        require(
            newMaxPercentage > 0 && newMaxPercentage <= 100,
            "Invalid percentage"
        );
        maxFlashLoanPercentage = newMaxPercentage;
    }

    /**
     * @dev Updates minimum flash loan amount
     * @param newMinAmount New minimum amount
     */
    function updateMinLoanAmount(uint256 newMinAmount) external onlyOwner {
        minFlashLoanAmount = newMinAmount;
    }

    /**
     * @dev Returns available liquidity for flash loans
     */
    function getAvailableLiquidity() external view returns (uint256) {
        return lstBtcToken.balanceOf(address(this));
    }
}
