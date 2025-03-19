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
 * @dev ERC20 token representing a share in the yield vault for BTC
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
 * @title lstWETH Token
 * @dev ERC20 token representing a share in the yield vault for WETH
 */
contract LstWETH is ERC20, Ownable {
    constructor() ERC20("Liquid Staked WETH", "lstWETH") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

/**
 * @title Dual Token Yield Vault
 * @dev Contract for staking BTC/wBTC and WETH and earning yield through lending strategies
 */
contract DualTokenYieldVault is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // BTC related variables
    IERC20 public btcToken;
    LstBTC public lstBTCToken;
    uint8 public btcDecimals;
    uint256 public btcTotalDeposited;
    uint256 public btcTotalValueLocked;

    // WETH related variables
    IERC20 public wethToken;
    LstWETH public lstWETHToken;
    uint8 public wethDecimals;
    uint256 public wethTotalDeposited;
    uint256 public wethTotalValueLocked;

    ILendingProtocol public lendingProtocol; // Lending protocol (e.g., Aave-like)

    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public lockPeriod = YEAR_IN_SECONDS; // 1 year lock period
    uint8 public constant LST_DECIMALS = 18; // ERC20 default

    // User deposit info
    struct UserDeposit {
        uint256 amount;
        uint256 depositTimestamp;
    }

    mapping(address => UserDeposit) public userBtcDeposits;
    mapping(address => UserDeposit) public userWethDeposits;

    // Events
    event DepositBTC(
        address indexed user,
        uint256 amount,
        uint256 lstBTCAmount
    );
    event WithdrawBTC(
        address indexed user,
        uint256 amount,
        uint256 lstBTCAmount
    );
    event YieldHarvestedBTC(uint256 yieldAmount);

    event DepositWETH(
        address indexed user,
        uint256 amount,
        uint256 lstWETHAmount
    );
    event WithdrawWETH(
        address indexed user,
        uint256 amount,
        uint256 lstWETHAmount
    );
    event YieldHarvestedWETH(uint256 yieldAmount);

    constructor(
        address _btcToken,
        address _wethToken,
        address _lendingProtocol
    ) Ownable(msg.sender) {
        btcToken = IERC20(_btcToken);
        wethToken = IERC20(_wethToken);
        lendingProtocol = ILendingProtocol(_lendingProtocol);

        // Create LST tokens
        lstBTCToken = new LstBTC();
        lstWETHToken = new LstWETH();

        // Get BTC token decimals
        try ERC20(_btcToken).decimals() returns (uint8 _decimals) {
            btcDecimals = _decimals;
        } catch {
            // Default to 8 decimals for BTC if the call fails
            btcDecimals = 8;
        }

        // Get WETH token decimals
        try ERC20(_wethToken).decimals() returns (uint8 _decimals) {
            wethDecimals = _decimals;
        } catch {
            // Default to 18 decimals for WETH if the call fails
            wethDecimals = 18;
        }
    }

    /**
     * @dev User deposits BTC and receives lstBTC
     * @param amount Amount of BTC to deposit
     */
    function depositBTC(uint256 amount) external nonReentrant {
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
        uint256 lstBTCToMint;
        if (LST_DECIMALS > btcDecimals) {
            // If lstBTC has more decimals than BTC, multiply
            lstBTCToMint = amount.mul(10 ** (LST_DECIMALS - btcDecimals));
        } else if (LST_DECIMALS < btcDecimals) {
            // If lstBTC has fewer decimals than BTC, divide
            lstBTCToMint = amount.div(10 ** (btcDecimals - LST_DECIMALS));
        } else {
            // If same number of decimals, 1:1 ratio
            lstBTCToMint = amount;
        }

        // Mint lstBTC to user
        lstBTCToken.mint(msg.sender, lstBTCToMint);

        // Update user deposit info
        userBtcDeposits[msg.sender] = UserDeposit({
            amount: userBtcDeposits[msg.sender].amount.add(amount),
            depositTimestamp: block.timestamp
        });

        // Update total amounts
        btcTotalDeposited = btcTotalDeposited.add(amount);
        btcTotalValueLocked = btcTotalValueLocked.add(amount);

        emit DepositBTC(msg.sender, amount, lstBTCToMint);
    }

    /**
     * @dev User deposits WETH and receives lstWETH
     * @param amount Amount of WETH to deposit
     */
    function depositWETH(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer WETH from user to this contract
        require(
            wethToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Allow lending protocol to use the WETH
        wethToken.approve(address(lendingProtocol), amount);

        // Deposit into lending protocol
        lendingProtocol.deposit(address(wethToken), amount);

        // Calculate lstWETH amount to mint with decimal adjustment
        uint256 lstWETHToMint;
        if (LST_DECIMALS > wethDecimals) {
            // If lstWETH has more decimals than WETH, multiply
            lstWETHToMint = amount.mul(10 ** (LST_DECIMALS - wethDecimals));
        } else if (LST_DECIMALS < wethDecimals) {
            // If lstWETH has fewer decimals than WETH, divide
            lstWETHToMint = amount.div(10 ** (wethDecimals - LST_DECIMALS));
        } else {
            // If same number of decimals, 1:1 ratio
            lstWETHToMint = amount;
        }

        // Mint lstWETH to user
        lstWETHToken.mint(msg.sender, lstWETHToMint);

        // Update user deposit info
        userWethDeposits[msg.sender] = UserDeposit({
            amount: userWethDeposits[msg.sender].amount.add(amount),
            depositTimestamp: block.timestamp
        });

        // Update total amounts
        wethTotalDeposited = wethTotalDeposited.add(amount);
        wethTotalValueLocked = wethTotalValueLocked.add(amount);

        emit DepositWETH(msg.sender, amount, lstWETHToMint);
    }

    /**
     * @dev User withdraws BTC by burning lstBTC after lock period
     * @param lstBTCAmount Amount of lstBTC to burn
     */
    function withdrawBTC(uint256 lstBTCAmount) external nonReentrant {
        require(lstBTCAmount > 0, "Amount must be greater than 0");
        require(
            lstBTCToken.balanceOf(msg.sender) >= lstBTCAmount,
            "Insufficient lstBTC balance"
        );

        UserDeposit storage userDeposit = userBtcDeposits[msg.sender];
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
        btcTotalDeposited = btcTotalDeposited > btcToWithdraw
            ? btcTotalDeposited.sub(btcToWithdraw)
            : 0;
        btcTotalValueLocked = btcTotalValueLocked > btcToWithdraw
            ? btcTotalValueLocked.sub(btcToWithdraw)
            : 0;

        emit WithdrawBTC(msg.sender, btcToWithdraw, lstBTCAmount);
    }

    /**
     * @dev User withdraws WETH by burning lstWETH after lock period
     * @param lstWETHAmount Amount of lstWETH to burn
     */
    function withdrawWETH(uint256 lstWETHAmount) external nonReentrant {
        require(lstWETHAmount > 0, "Amount must be greater than 0");
        require(
            lstWETHToken.balanceOf(msg.sender) >= lstWETHAmount,
            "Insufficient lstWETH balance"
        );

        UserDeposit storage userDeposit = userWethDeposits[msg.sender];
        require(
            block.timestamp >= userDeposit.depositTimestamp + lockPeriod,
            "Lock period not expired"
        );

        // Calculate WETH amount to withdraw, including yield
        uint256 wethToWithdraw = calculateWETHAmount(lstWETHAmount);

        // Withdraw from lending protocol
        lendingProtocol.withdraw(address(wethToken), wethToWithdraw);

        // Burn lstWETH tokens
        lstWETHToken.burn(msg.sender, lstWETHAmount);

        // Transfer WETH to user
        require(
            wethToken.transfer(msg.sender, wethToWithdraw),
            "Transfer failed"
        );

        // Update user deposit
        userDeposit.amount = userDeposit.amount > wethToWithdraw
            ? userDeposit.amount.sub(wethToWithdraw)
            : 0;

        // Update totals
        wethTotalDeposited = wethTotalDeposited > wethToWithdraw
            ? wethTotalDeposited.sub(wethToWithdraw)
            : 0;
        wethTotalValueLocked = wethTotalValueLocked > wethToWithdraw
            ? wethTotalValueLocked.sub(wethToWithdraw)
            : 0;

        emit WithdrawWETH(msg.sender, wethToWithdraw, lstWETHAmount);
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
        uint256 btcAmount = lstBTCAmount.mul(btcTotalValueLocked).div(
            lstBTCTotalSupply
        );

        // Convert from lstBTC decimals to BTC decimals
        if (LST_DECIMALS > btcDecimals) {
            // If lstBTC has more decimals than BTC, divide
            return btcAmount.div(10 ** (LST_DECIMALS - btcDecimals));
        } else if (LST_DECIMALS < btcDecimals) {
            // If lstBTC has fewer decimals than BTC, multiply
            return btcAmount.mul(10 ** (btcDecimals - LST_DECIMALS));
        } else {
            // If same number of decimals, no adjustment needed
            return btcAmount;
        }
    }

    /**
     * @dev Calculate amount of WETH for a given lstWETH amount
     * @param lstWETHAmount Amount of lstWETH
     * @return WETH amount including yield
     */
    function calculateWETHAmount(
        uint256 lstWETHAmount
    ) public view returns (uint256) {
        uint256 lstWETHTotalSupply = lstWETHToken.totalSupply();
        if (lstWETHTotalSupply == 0) return 0;

        // Calculate WETH amount based on the proportion of lstWETH being withdrawn
        uint256 wethAmount = lstWETHAmount.mul(wethTotalValueLocked).div(
            lstWETHTotalSupply
        );

        // Convert from lstWETH decimals to WETH decimals
        if (LST_DECIMALS > wethDecimals) {
            // If lstWETH has more decimals than WETH, divide
            return wethAmount.div(10 ** (LST_DECIMALS - wethDecimals));
        } else if (LST_DECIMALS < wethDecimals) {
            // If lstWETH has fewer decimals than WETH, multiply
            return wethAmount.mul(10 ** (wethDecimals - LST_DECIMALS));
        } else {
            // If same number of decimals, no adjustment needed
            return wethAmount;
        }
    }

    /**
     * @dev Harvests yield from lending protocol for BTC and updates btcTotalValueLocked
     */
    function harvestBTCYield() external onlyOwner {
        uint256 prevTotalValueLocked = btcTotalValueLocked;

        // Get current value in lending protocol
        uint256 currentValue = getCurrentBTCValueInLendingProtocol();

        require(currentValue >= prevTotalValueLocked, "Value cannot decrease");

        uint256 yieldAmount = currentValue.sub(prevTotalValueLocked);
        if (yieldAmount > 0) {
            btcTotalValueLocked = currentValue;
            emit YieldHarvestedBTC(yieldAmount);
        }
    }

    /**
     * @dev Harvests yield from lending protocol for WETH and updates wethTotalValueLocked
     */
    function harvestWETHYield() external onlyOwner {
        uint256 prevTotalValueLocked = wethTotalValueLocked;

        // Get current value in lending protocol
        uint256 currentValue = getCurrentWETHValueInLendingProtocol();

        require(currentValue >= prevTotalValueLocked, "Value cannot decrease");

        uint256 yieldAmount = currentValue.sub(prevTotalValueLocked);
        if (yieldAmount > 0) {
            wethTotalValueLocked = currentValue;
            emit YieldHarvestedWETH(yieldAmount);
        }
    }

    /**
     * @dev Get current BTC value in lending protocol
     */
    function getCurrentBTCValueInLendingProtocol()
        internal
        view
        returns (uint256)
    {
        // Simulate yield by adding APY-based increase
        uint256 apy = lendingProtocol.getAPY(address(btcToken));
        uint256 timeWeight = block.timestamp % YEAR_IN_SECONDS; // Simplified
        uint256 estimatedYield = btcTotalDeposited
            .mul(apy)
            .mul(timeWeight)
            .div(YEAR_IN_SECONDS)
            .div(10000);
        return btcTotalDeposited.add(estimatedYield);
    }

    /**
     * @dev Get current WETH value in lending protocol
     */
    function getCurrentWETHValueInLendingProtocol()
        internal
        view
        returns (uint256)
    {
        // Simulate yield by adding APY-based increase
        uint256 apy = lendingProtocol.getAPY(address(wethToken));
        uint256 timeWeight = block.timestamp % YEAR_IN_SECONDS; // Simplified
        uint256 estimatedYield = wethTotalDeposited
            .mul(apy)
            .mul(timeWeight)
            .div(YEAR_IN_SECONDS)
            .div(10000);
        return wethTotalDeposited.add(estimatedYield);
    }

    /**
     * @dev Get current BTC APY
     */
    function getBTCAPY() external view returns (uint256) {
        return lendingProtocol.getAPY(address(btcToken));
    }

    /**
     * @dev Get current WETH APY
     */
    function getWETHAPY() external view returns (uint256) {
        return lendingProtocol.getAPY(address(wethToken));
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
