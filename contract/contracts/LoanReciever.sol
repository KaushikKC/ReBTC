// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
 * @title DirectRepaymentReceiver
 * @dev A flash loan receiver that uses direct transfer for repayment
 */
contract DirectRepaymentReceiver is IFlashLoanReceiver {
    IERC20 public token;
    address public owner;

    // Events for debugging
    event ReceivedLoan(address lender, uint256 amount, uint256 fee);
    event BalanceCheck(string message, uint256 balance);
    event DirectRepayment(address to, uint256 amount, bool success);

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
    }

    /**
     * @dev This function is called after receiving the flash loan
     * Instead of approving tokens, we directly transfer them back
     */
    function executeOperation(
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external override returns (bool) {
        // Log received loan details
        emit ReceivedLoan(msg.sender, amount, fee);

        // Check balance after receiving loan
        uint256 balance = token.balanceOf(address(this));
        emit BalanceCheck("Balance after receiving loan", balance);

        // Calculate total repayment amount
        uint256 totalRepayment = amount + fee;

        // Check if we have enough balance
        require(
            balance >= totalRepayment,
            "Insufficient balance for repayment"
        );

        // Directly transfer tokens back to the lender
        bool success = token.transfer(msg.sender, totalRepayment);
        emit DirectRepayment(msg.sender, totalRepayment, success);
        require(success, "Direct repayment failed");

        // Check balance after repayment
        balance = token.balanceOf(address(this));
        emit BalanceCheck("Balance after repayment", balance);

        return true;
    }

    /**
     * @dev Fund this contract with tokens for repayment
     */
    function fundContract(uint256 amount) external {
        require(msg.sender == owner, "Only owner can fund");

        // Check balance before funding
        uint256 balanceBefore = token.balanceOf(address(this));
        emit BalanceCheck("Balance before funding", balanceBefore);

        // Transfer tokens from sender to this contract
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        // Check balance after funding
        uint256 balanceAfter = token.balanceOf(address(this));
        emit BalanceCheck("Balance after funding", balanceAfter);

        // Verify the correct amount was transferred
        require(
            balanceAfter == balanceBefore + amount,
            "Funding amount mismatch"
        );
    }

    /**
     * @dev Get current token balance
     */
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Withdraw tokens from this contract
     */
    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");

        uint256 balance = token.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");

        bool success = token.transfer(msg.sender, amount);
        require(success, "Token transfer failed");
    }

    /**
     * @dev Request a flash loan
     */
    function requestFlashLoan(
        address lender,
        uint256 amount,
        string calldata actionParam
    ) external {
        require(msg.sender == owner, "Only owner can request flash loan");

        // Convert string to bytes
        bytes memory params = bytes(actionParam);

        // Call the flash loan function
        (bool success, ) = lender.call(
            abi.encodeWithSignature(
                "flashLoan(address,uint256,bytes)",
                address(this),
                amount,
                params
            )
        );

        require(success, "Flash loan request failed");
    }
}
