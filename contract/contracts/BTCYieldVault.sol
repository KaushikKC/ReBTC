// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Interface for lending protocols (simplified Aave-like interface)
interface ILendingProtocol {
    function deposit(address asset, uint256 amount) external returns (uint256);

    function withdraw(address asset, uint256 amount) external returns (uint256);

    function getAPY(address asset) external view returns (uint256);
}

/**
 * @title lstBTC Token
 * @dev ERC20 token representing a share in the yield vault
 */
contract LstBTC is ERC20, Ownable {
    constructor() ERC20("Liquid Staked BTC", "lstBTC") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

/**
 * @title BTC Yield Vault
 * @dev Contract for staking BTC/wBTC and earning yield through lending strategies
 */
contract BTCYieldVault is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public btcToken; // BTC/wBTC token
    LstBTC public lstBTCToken; // Liquid staked BTC token
    ILendingProtocol public lendingProtocol; // Lending protocol (e.g., Aave-like)

    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public lockPeriod = YEAR_IN_SECONDS; // 1 year lock period

    // Decimal adjustment factors
    uint8 public btcDecimals; // Will be set in constructor
    uint8 public constant LST_BTC_DECIMALS = 18; // ERC20 default

    // User deposit info
    struct UserDeposit {
        uint256 amount; // Amount of BTC deposited
        uint256 depositTimestamp; // Time of deposit
    }

    mapping(address => UserDeposit) public userDeposits;
    uint256 public totalDeposited; // Total BTC deposited
    uint256 public totalValueLocked; // Total value locked including earned yield

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 lstBTCAmount);
    event Withdraw(address indexed user, uint256 amount, uint256 lstBTCAmount);
    event YieldHarvested(uint256 yieldAmount);

    constructor(
        address _btcToken,
        address _lendingProtocol
    ) Ownable(msg.sender) {
        btcToken = IERC20(_btcToken);
        lstBTCToken = new LstBTC();
        lendingProtocol = ILendingProtocol(_lendingProtocol);

        // Get BTC token decimals
        // Note: This assumes the token implements the ERC20 decimals() function
        // If using in Remix with a mock token, ensure it has this function
        try ERC20(_btcToken).decimals() returns (uint8 _decimals) {
            btcDecimals = _decimals;
        } catch {
            // Default to 8 decimals for BTC if the call fails
            btcDecimals = 8;
        }
    }

    /**
     * @dev User deposits BTC and receives lstBTC
     * @param amount Amount of BTC to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer BTC from user to this contract
        require(
            btcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Allow lending protocol to use the BTC
        btcToken.approve(address(lendingProtocol), amount);

        // Deposit into lending protocol
        lendingProtocol.deposit(address(btcToken), amount);

        // Calculate lstBTC amount to mint with decimal adjustment
        // Convert from BTC decimals to lstBTC decimals (18)
        uint256 lstBTCToMint;
        if (LST_BTC_DECIMALS > btcDecimals) {
            // If lstBTC has more decimals than BTC, multiply
            lstBTCToMint = amount.mul(10 ** (LST_BTC_DECIMALS - btcDecimals));
        } else if (LST_BTC_DECIMALS < btcDecimals) {
            // If lstBTC has fewer decimals than BTC, divide
            lstBTCToMint = amount.div(10 ** (btcDecimals - LST_BTC_DECIMALS));
        } else {
            // If same number of decimals, 1:1 ratio
            lstBTCToMint = amount;
        }

        // Mint lstBTC to user
        lstBTCToken.mint(msg.sender, lstBTCToMint);

        // Update user deposit info
        userDeposits[msg.sender] = UserDeposit({
            amount: userDeposits[msg.sender].amount.add(amount),
            depositTimestamp: block.timestamp
        });

        // Update total amounts
        totalDeposited = totalDeposited.add(amount);
        totalValueLocked = totalValueLocked.add(amount);

        emit Deposit(msg.sender, amount, lstBTCToMint);
    }

    /**
     * @dev User withdraws BTC by burning lstBTC after lock period
     * @param lstBTCAmount Amount of lstBTC to burn
     */
    function withdraw(uint256 lstBTCAmount) external nonReentrant {
        require(lstBTCAmount > 0, "Amount must be greater than 0");
        require(
            lstBTCToken.balanceOf(msg.sender) >= lstBTCAmount,
            "Insufficient lstBTC balance"
        );

        UserDeposit storage userDeposit = userDeposits[msg.sender];
        require(
            block.timestamp >= userDeposit.depositTimestamp + lockPeriod,
            "Lock period not expired"
        );

        // Calculate BTC amount to withdraw, including yield
        uint256 btcToWithdraw = calculateBTCAmount(lstBTCAmount);

        // Withdraw from lending protocol
        lendingProtocol.withdraw(address(btcToken), btcToWithdraw);

        // Burn lstBTC tokens
        lstBTCToken.burn(msg.sender, lstBTCAmount);

        // Transfer BTC to user
        require(
            btcToken.transfer(msg.sender, btcToWithdraw),
            "Transfer failed"
        );

        // Update user deposit
        userDeposit.amount = userDeposit.amount > btcToWithdraw
            ? userDeposit.amount.sub(btcToWithdraw)
            : 0;

        // Update totals
        totalDeposited = totalDeposited > btcToWithdraw
            ? totalDeposited.sub(btcToWithdraw)
            : 0;
        totalValueLocked = totalValueLocked > btcToWithdraw
            ? totalValueLocked.sub(btcToWithdraw)
            : 0;

        emit Withdraw(msg.sender, btcToWithdraw, lstBTCAmount);
    }

    /**
     * @dev Calculate amount of BTC for a given lstBTC amount
     * @param lstBTCAmount Amount of lstBTC
     * @return BTC amount including yield
     */
    function calculateBTCAmount(
        uint256 lstBTCAmount
    ) public view returns (uint256) {
        uint256 lstBTCTotalSupply = lstBTCToken.totalSupply();
        if (lstBTCTotalSupply == 0) return 0;

        // Calculate BTC amount based on the proportion of lstBTC being withdrawn
        uint256 btcAmount = lstBTCAmount.mul(totalValueLocked).div(
            lstBTCTotalSupply
        );

        // Convert from lstBTC decimals to BTC decimals
        if (LST_BTC_DECIMALS > btcDecimals) {
            // If lstBTC has more decimals than BTC, divide
            return btcAmount.div(10 ** (LST_BTC_DECIMALS - btcDecimals));
        } else if (LST_BTC_DECIMALS < btcDecimals) {
            // If lstBTC has fewer decimals than BTC, multiply
            return btcAmount.mul(10 ** (btcDecimals - LST_BTC_DECIMALS));
        } else {
            // If same number of decimals, no adjustment needed
            return btcAmount;
        }
    }

    /**
     * @dev Harvests yield from lending protocol and updates totalValueLocked
     * Can be called by admin or automatically by a keeper
     */
    function harvestYield() external onlyOwner {
        uint256 prevTotalValueLocked = totalValueLocked;

        // Get current value in lending protocol - this would be implemented
        // based on specific lending protocol's API
        uint256 currentValue = getCurrentValueInLendingProtocol();

        require(currentValue >= prevTotalValueLocked, "Value cannot decrease");

        uint256 yieldAmount = currentValue.sub(prevTotalValueLocked);
        if (yieldAmount > 0) {
            totalValueLocked = currentValue;
            emit YieldHarvested(yieldAmount);
        }
    }

    /**
     * @dev Get current value in lending protocol
     * Placeholder implementation - would be customized for specific lending protocol
     */
    function getCurrentValueInLendingProtocol()
        internal
        view
        returns (uint256)
    {
        // This would be implemented according to specific lending protocol
        // For now, simulate yield by adding APY-based increase
        uint256 apy = lendingProtocol.getAPY(address(btcToken));
        uint256 timeWeight = block.timestamp % YEAR_IN_SECONDS; // Simplified
        uint256 estimatedYield = totalDeposited
            .mul(apy)
            .mul(timeWeight)
            .div(YEAR_IN_SECONDS)
            .div(10000);
        return totalDeposited.add(estimatedYield);
    }

    /**
     * @dev Get current APY
     */
    function getCurrentAPY() external view returns (uint256) {
        return lendingProtocol.getAPY(address(btcToken));
    }

    /**
     * @dev Update lending protocol address
     */
    function setLendingProtocol(address _lendingProtocol) external onlyOwner {
        lendingProtocol = ILendingProtocol(_lendingProtocol);
    }

    /**
     * @dev Update lock period
     */
    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        lockPeriod = _lockPeriod;
    }
}
