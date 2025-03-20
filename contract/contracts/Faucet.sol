// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title TokenFaucet
 * @dev Contract for distributing test tokens to users
 */
contract TokenFaucet is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Token addresses
    address public btcToken;
    address public lstBTCToken;
    address public usdcToken;
    address public usdtToken;

    // Request amounts (in token's smallest unit)
    mapping(address => uint256) public requestAmounts;

    // Daily limits per user
    mapping(address => uint256) public dailyLimits;

    // Cooldown period between requests (in seconds)
    uint256 public cooldownPeriod = 24 hours;

    // Track last request time for each user and token
    mapping(address => mapping(address => uint256)) public lastRequestTime;

    // Track daily request count for each user and token
    mapping(address => mapping(address => uint256)) public dailyRequestCount;

    // Track when the daily count resets
    mapping(address => mapping(address => uint256)) public dailyCountResetTime;

    // Events
    event TokensRequested(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event DailyLimitUpdated(address indexed token, uint256 newLimit);
    event RequestAmountUpdated(address indexed token, uint256 newAmount);
    event CooldownPeriodUpdated(uint256 newPeriod);

    constructor(
        address _btcToken,
        address _lstBTCToken,
        address _usdcToken,
        address _usdtToken
    ) Ownable(msg.sender) {
        btcToken = _btcToken;
        lstBTCToken = _lstBTCToken;
        usdcToken = _usdcToken;
        usdtToken = _usdtToken;

        // Set default request amounts
        // BTC with 8 decimals: 0.1 BTC = 10000000
        requestAmounts[_btcToken] = 10000000;
        requestAmounts[_lstBTCToken] = 1000000000000000000;
        // USDC with 6 decimals: 100 USDC = 100000000
        requestAmounts[_usdcToken] = 100000000;
        // USDT with 6 decimals: 100 USDT = 100000000
        requestAmounts[_usdtToken] = 100000000;

        // Set default daily limits
        dailyLimits[_btcToken] = 3;
        dailyLimits[_lstBTCToken] = 3;
        dailyLimits[_usdcToken] = 5;
        dailyLimits[_usdtToken] = 5;
    }

    /**
     * @dev Request BTC tokens from the faucet
     */
    function requestBTC() external nonReentrant {
        _requestTokens(btcToken);
    }

    /**
     * @dev Request ReBTC tokens from the faucet
     */
    function requestlstBTC() external nonReentrant {
        _requestTokens(lstBTCToken);
    }

    /**
     * @dev Request USDC tokens from the faucet
     */
    function requestUSDC() external nonReentrant {
        _requestTokens(usdcToken);
    }

    /**
     * @dev Request USDT tokens from the faucet
     */
    function requestUSDT() external nonReentrant {
        _requestTokens(usdtToken);
    }

    /**
     * @dev Internal function to handle token requests
     * @param token Address of the token to request
     */
    function _requestTokens(address token) internal {
        // Check if token is supported
        require(
            token == btcToken ||
                token == lstBTCToken ||
                token == usdcToken ||
                token == usdtToken,
            "Unsupported token"
        );

        // Check cooldown period
        require(
            block.timestamp >=
                lastRequestTime[msg.sender][token] + cooldownPeriod,
            "Please wait before requesting again"
        );

        // Check if we need to reset daily count
        if (block.timestamp >= dailyCountResetTime[msg.sender][token]) {
            dailyRequestCount[msg.sender][token] = 0;
            dailyCountResetTime[msg.sender][token] = block.timestamp + 24 hours;
        }

        // Check daily limit
        require(
            dailyRequestCount[msg.sender][token] < dailyLimits[token],
            "Daily request limit reached"
        );

        // Check if faucet has enough tokens
        uint256 amount = requestAmounts[token];
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Faucet is empty"
        );

        // Update request tracking
        lastRequestTime[msg.sender][token] = block.timestamp;
        dailyRequestCount[msg.sender][token] += 1;

        // Transfer tokens to user
        require(
            IERC20(token).transfer(msg.sender, amount),
            "Token transfer failed"
        );

        emit TokensRequested(msg.sender, token, amount);
    }

    /**
     * @dev Get token balance in the faucet
     * @param token Address of the token
     * @return Balance of the token in the faucet
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get last request time for a user and token
     * @param user User address
     * @param token Token address
     * @return Timestamp of the last request
     */
    function getLastRequestTime(
        address user,
        address token
    ) external view returns (uint256) {
        return lastRequestTime[user][token];
    }

    /**
     * @dev Get daily limit for a token
     * @param token Token address
     * @return Daily request limit
     */
    function getDailyLimit(address token) external view returns (uint256) {
        return dailyLimits[token];
    }

    /**
     * @dev Get remaining requests for a user and token
     * @param user User address
     * @param token Token address
     * @return Number of requests remaining today
     */
    function getRequestsRemaining(
        address user,
        address token
    ) external view returns (uint256) {
        // If daily count has reset, return full limit
        if (block.timestamp >= dailyCountResetTime[user][token]) {
            return dailyLimits[token];
        }

        // Otherwise return remaining count
        return dailyLimits[token] - dailyRequestCount[user][token];
    }

    /**
     * @dev Set daily limit for a token
     * @param token Token address
     * @param limit New daily limit
     */
    function setDailyLimit(address token, uint256 limit) external onlyOwner {
        dailyLimits[token] = limit;
        emit DailyLimitUpdated(token, limit);
    }

    /**
     * @dev Set request amount for a token
     * @param token Token address
     * @param amount New request amount
     */
    function setRequestAmount(
        address token,
        uint256 amount
    ) external onlyOwner {
        requestAmounts[token] = amount;
        emit RequestAmountUpdated(token, amount);
    }

    /**
     * @dev Set cooldown period between requests
     * @param period New cooldown period in seconds
     */
    function setCooldownPeriod(uint256 period) external onlyOwner {
        cooldownPeriod = period;
        emit CooldownPeriodUpdated(period);
    }

    /**
     * @dev Withdraw tokens from the faucet (owner only)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(
            IERC20(token).transfer(owner(), amount),
            "Token transfer failed"
        );
    }
}
