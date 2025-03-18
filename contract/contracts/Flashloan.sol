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
 * @title ModifiedLstBtcFlashLoan
 * @dev Flash loan provider for lstBTC tokens with direct repayment
 */
contract ModifiedLstBtcFlashLoan is ReentrancyGuard, Ownable {
    IERC20 public lstBtcToken;

    // Fee percentage in basis points (e.g., 30 = 0.3%)
    uint256 public flashLoanFeePercentage = 30;

    // Total fees collected
    uint256 public totalFeesCollected;

    // Total liquidity provided
    uint256 public totalLiquidity;

    // Mapping of liquidity providers to their provided amounts
    mapping(address => uint256) public liquidityProviders;

    // Events
    event FlashLoan(address indexed receiver, uint256 amount, uint256 fee);
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event BalanceCheck(string message, uint256 balance);

    constructor(address _owner, address _lstBtcToken) Ownable(_owner) {
        lstBtcToken = IERC20(_lstBtcToken);
    }

    /**
     * @dev Provides a flash loan to the receiver contract
     * @param receiver The contract receiving the tokens
     * @param amount The amount of tokens lent
     * @param params Arbitrary data to pass to the receiver
     */
    function flashLoan(
        address receiver,
        uint256 amount,
        bytes calldata params
    ) external nonReentrant {
        // Check available liquidity
        uint256 availableLiquidity = getAvailableLiquidity();
        require(availableLiquidity >= amount, "Insufficient liquidity");

        // Calculate fee
        uint256 fee = (amount * flashLoanFeePercentage) / 10000;

        // Check balance before loan
        uint256 balanceBefore = lstBtcToken.balanceOf(address(this));
        emit BalanceCheck("Balance before loan", balanceBefore);

        // Transfer tokens to receiver
        require(lstBtcToken.transfer(receiver, amount), "Transfer failed");

        // Execute operation on receiver
        require(
            IFlashLoanReceiver(receiver).executeOperation(amount, fee, params),
            "Flash loan execution failed"
        );

        // Check balance after execution
        uint256 balanceAfter = lstBtcToken.balanceOf(address(this));
        emit BalanceCheck("Balance after execution", balanceAfter);

        // Verify repayment - the balance should be at least the original balance
        require(
            balanceAfter >= balanceBefore + fee,
            "Flash loan not repaid correctly"
        );

        // Update fees collected
        totalFeesCollected += fee;

        emit FlashLoan(receiver, amount, fee);
    }

    /**
     * @dev Add liquidity to the flash loan pool
     * @param amount Amount of tokens to add
     */
    function addLiquidity(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer tokens from user to this contract
        require(
            lstBtcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Update liquidity provider's balance
        liquidityProviders[msg.sender] += amount;

        // Update total liquidity
        totalLiquidity += amount;

        emit LiquidityAdded(msg.sender, amount);
    }

    /**
     * @dev Remove liquidity from the flash loan pool
     * @param amount Amount of tokens to remove
     */
    function removeLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            liquidityProviders[msg.sender] >= amount,
            "Insufficient liquidity"
        );

        // Calculate available liquidity (excluding fees)
        uint256 availableLiquidity = getAvailableLiquidity() -
            totalFeesCollected;
        require(
            availableLiquidity >= amount,
            "Insufficient available liquidity"
        );

        // Update liquidity provider's balance
        liquidityProviders[msg.sender] -= amount;

        // Update total liquidity
        totalLiquidity -= amount;

        // Transfer tokens to user
        require(lstBtcToken.transfer(msg.sender, amount), "Transfer failed");

        emit LiquidityRemoved(msg.sender, amount);
    }

    /**
     * @dev Withdraw collected fees
     * @param recipient Address to receive the fees
     */
    function withdrawFees(address recipient) external onlyOwner nonReentrant {
        require(totalFeesCollected > 0, "No fees to withdraw");

        uint256 feesToWithdraw = totalFeesCollected;
        totalFeesCollected = 0;

        require(
            lstBtcToken.transfer(recipient, feesToWithdraw),
            "Transfer failed"
        );

        emit FeesWithdrawn(recipient, feesToWithdraw);
    }

    /**
     * @dev Set the flash loan fee percentage
     * @param newFeePercentage New fee percentage in basis points
     */
    function setFlashLoanFeePercentage(
        uint256 newFeePercentage
    ) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee percentage too high"); // Max 10%
        flashLoanFeePercentage = newFeePercentage;
    }

    /**
     * @dev Get available liquidity in the flash loan pool
     * @return Available liquidity
     */
    function getAvailableLiquidity() public view returns (uint256) {
        return lstBtcToken.balanceOf(address(this));
    }
}
