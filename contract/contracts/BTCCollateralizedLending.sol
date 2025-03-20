// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IPriceOracle {
    function getPrice(address asset) external view returns (uint256);
}

interface IBTCInsurancePool {
    function depositToPool(uint256 _amount) external;
}

/**
 * @title BTC Collateralized Lending
 * @dev Contract for borrowing stablecoins using lstBTC as collateral
 */
contract BTCCollateralizedLending is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public lstBTCToken; // lstBTC token from Yield Vault
    IERC20 public stablecoinUSDT; // USDT stablecoin
    IERC20 public stablecoinUSDC; // USDC stablecoin
    IPriceOracle public priceOracle; // Price oracle for BTC/USD
    IBTCInsurancePool public insurancePool; // Insurance pool contract

    uint256 public constant LTV_RATIO = 7000; // 70% Loan-to-Value (scaled by 10000)
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% Liquidation threshold (scaled by 10000)
    uint256 public constant LIQUIDATION_BONUS = 500; // 5% Liquidation bonus (scaled by 10000)
    uint256 public constant INTEREST_RATE = 500; // 5% Annual interest rate (scaled by 10000)
    uint256 public constant ORIGINATION_FEE = 50; // 0.5% Origination fee (scaled by 10000)
    uint256 public constant YEAR_IN_SECONDS = 365 days;

    struct LoanPosition {
        uint256 collateralAmount; // Amount of lstBTC collateral
        uint256 borrowedUSDT; // Amount of USDT borrowed
        uint256 borrowedUSDC; // Amount of USDC borrowed
        uint256 originationTimestamp; // When loan was created
        uint256 lastInterestCalcTimestamp; // Last time interest was calculated
        uint256 accumulatedInterest; // Accumulated interest
    }

    mapping(address => LoanPosition) public loanPositions;

    // Events
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, address stablecoin, uint256 amount);
    event LoanRepaid(address indexed user, address stablecoin, uint256 amount);
    event PositionLiquidated(
        address indexed user,
        address liquidator,
        uint256 collateralLiquidated
    );

    constructor(
        address _lstBTCToken,
        address _stablecoinUSDT,
        address _stablecoinUSDC,
        address _priceOracle,
        address _insurancePool
    ) Ownable(msg.sender) {
        lstBTCToken = IERC20(_lstBTCToken);
        stablecoinUSDT = IERC20(_stablecoinUSDT);
        stablecoinUSDC = IERC20(_stablecoinUSDC);
        priceOracle = IPriceOracle(_priceOracle);
        insurancePool = IBTCInsurancePool(_insurancePool);
    }

    /**
     * @dev Allows admin to fund the contract with stablecoins
     * @param amount Amount of stablecoin to deposit
     * @param isUSDT True for USDT, false for USDC
     */
    function fundContract(uint256 amount, bool isUSDT) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");

        if (isUSDT) {
            require(
                stablecoinUSDT.transferFrom(msg.sender, address(this), amount),
                "Transfer failed"
            );
        } else {
            require(
                stablecoinUSDC.transferFrom(msg.sender, address(this), amount),
                "Transfer failed"
            );
        }
    }

    /**
     * @dev User deposits lstBTC as collateral and immediately borrows stablecoin
     * @param collateralAmount Amount of lstBTC to deposit
     * @param borrowAmount Amount of stablecoin to borrow
     * @param isUSDT True for USDT, false for USDC
     */
    function depositAndBorrow(
        uint256 collateralAmount,
        uint256 borrowAmount,
        bool isUSDT
    ) external nonReentrant {
        require(
            collateralAmount > 0,
            "Collateral amount must be greater than 0"
        );

        // Transfer lstBTC from user to this contract
        require(
            lstBTCToken.transferFrom(
                msg.sender,
                address(this),
                collateralAmount
            ),
            "Transfer failed"
        );

        // Approve insurance pool to take lstBTC from this contract
        lstBTCToken.approve(address(insurancePool), collateralAmount);

        // Deposit lstBTC to insurance pool
        insurancePool.depositToPool(collateralAmount);

        // Update user's collateral
        LoanPosition storage position = loanPositions[msg.sender];
        position.collateralAmount = position.collateralAmount.add(
            collateralAmount
        );

        emit CollateralDeposited(msg.sender, collateralAmount);

        // If borrowAmount is specified, process borrowing
        if (borrowAmount > 0) {
            // Calculate current debt
            updateInterest(msg.sender);
            uint256 totalDebt = getTotalDebt(msg.sender);

            // Calculate new debt
            uint256 fee = borrowAmount.mul(ORIGINATION_FEE).div(10000);
            uint256 totalBorrow = borrowAmount.add(fee);
            uint256 newTotalDebt = totalDebt.add(totalBorrow);

            // Check if borrow amount respects LTV ratio
            uint256 collateralValue = getCollateralValue(
                position.collateralAmount
            );
            require(
                collateralValue.mul(LTV_RATIO) >= newTotalDebt.mul(10000),
                "Borrow would exceed LTV ratio"
            );

            // Check contract balance
            if (isUSDT) {
                require(
                    stablecoinUSDT.balanceOf(address(this)) >= borrowAmount,
                    "Insufficient USDT in contract"
                );
                position.borrowedUSDT = position.borrowedUSDT.add(totalBorrow);
                require(
                    stablecoinUSDT.transfer(msg.sender, borrowAmount),
                    "Transfer failed"
                );
                emit LoanTaken(
                    msg.sender,
                    address(stablecoinUSDT),
                    borrowAmount
                );
            } else {
                require(
                    stablecoinUSDC.balanceOf(address(this)) >= borrowAmount,
                    "Insufficient USDC in contract"
                );
                position.borrowedUSDC = position.borrowedUSDC.add(totalBorrow);
                require(
                    stablecoinUSDC.transfer(msg.sender, borrowAmount),
                    "Transfer failed"
                );
                emit LoanTaken(
                    msg.sender,
                    address(stablecoinUSDC),
                    borrowAmount
                );
            }

            // Update interest calculation timestamp and origination timestamp
            position.lastInterestCalcTimestamp = block.timestamp;
            if (position.originationTimestamp == 0) {
                position.originationTimestamp = block.timestamp;
            }
        }
    }

    /**
     * @dev User adds more collateral to an existing position
     * @param amount Amount of lstBTC to add
     */
    function addCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer lstBTC from user to this contract
        require(
            lstBTCToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Approve insurance pool to take lstBTC from this contract
        lstBTCToken.approve(address(insurancePool), amount);

        // Deposit lstBTC to insurance pool
        insurancePool.depositToPool(amount);

        // Update user's collateral
        LoanPosition storage position = loanPositions[msg.sender];
        position.collateralAmount = position.collateralAmount.add(amount);

        emit CollateralDeposited(msg.sender, amount);
    }

    /**
     * @dev User withdraws lstBTC collateral if loan-to-value ratio permits
     * @param amount Amount of lstBTC to withdraw
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        LoanPosition storage position = loanPositions[msg.sender];
        require(
            amount > 0 && amount <= position.collateralAmount,
            "Invalid withdrawal amount"
        );

        // Calculate current debt (borrowed + interest)
        updateInterest(msg.sender);
        uint256 totalDebt = getTotalDebt(msg.sender);

        // Calculate collateral value after withdrawal
        uint256 remainingCollateral = position.collateralAmount.sub(amount);
        uint256 remainingCollateralValue = getCollateralValue(
            remainingCollateral
        );

        // Ensure sufficient collateral remains
        require(
            totalDebt == 0 ||
                remainingCollateralValue.mul(LTV_RATIO) >= totalDebt.mul(10000),
            "Withdrawal would exceed LTV ratio"
        );

        // Update collateral amount
        position.collateralAmount = remainingCollateral;

        // Transfer lstBTC back to user
        require(lstBTCToken.transfer(msg.sender, amount), "Transfer failed");

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @dev User borrows additional stablecoin against existing collateral
     * @param isUSDT True for USDT, false for USDC
     * @param amount Amount of stablecoin to borrow
     */
    function borrowMore(bool isUSDT, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        LoanPosition storage position = loanPositions[msg.sender];
        require(position.collateralAmount > 0, "No collateral deposited");

        // Calculate current debt
        updateInterest(msg.sender);
        uint256 totalDebt = getTotalDebt(msg.sender);

        // Calculate new debt
        uint256 fee = amount.mul(ORIGINATION_FEE).div(10000);
        uint256 totalBorrow = amount.add(fee);
        uint256 newTotalDebt = totalDebt.add(totalBorrow);

        // Check if borrow amount respects LTV ratio
        uint256 collateralValue = getCollateralValue(position.collateralAmount);
        require(
            collateralValue.mul(LTV_RATIO) >= newTotalDebt.mul(10000),
            "Borrow would exceed LTV ratio"
        );

        // Check contract balance
        if (isUSDT) {
            require(
                stablecoinUSDT.balanceOf(address(this)) >= amount,
                "Insufficient USDT in contract"
            );
            position.borrowedUSDT = position.borrowedUSDT.add(totalBorrow);
            require(
                stablecoinUSDT.transfer(msg.sender, amount),
                "Transfer failed"
            );
            emit LoanTaken(msg.sender, address(stablecoinUSDT), amount);
        } else {
            require(
                stablecoinUSDC.balanceOf(address(this)) >= amount,
                "Insufficient USDC in contract"
            );
            position.borrowedUSDC = position.borrowedUSDC.add(totalBorrow);
            require(
                stablecoinUSDC.transfer(msg.sender, amount),
                "Transfer failed"
            );
            emit LoanTaken(msg.sender, address(stablecoinUSDC), amount);
        }

        // Update interest calculation timestamp
        position.lastInterestCalcTimestamp = block.timestamp;
        if (position.originationTimestamp == 0) {
            position.originationTimestamp = block.timestamp;
        }
    }

    /**
     * @dev User repays stablecoin loan
     * @param isUSDT True for USDT, false for USDC
     * @param amount Amount of stablecoin to repay
     */
    function repay(bool isUSDT, uint256 amount) external nonReentrant {
        LoanPosition storage position = loanPositions[msg.sender];

        // Update interest
        updateInterest(msg.sender);

        uint256 debt;
        IERC20 stablecoin;

        if (isUSDT) {
            debt = position.borrowedUSDT;
            stablecoin = stablecoinUSDT;
        } else {
            debt = position.borrowedUSDC;
            stablecoin = stablecoinUSDC;
        }

        require(debt > 0, "No debt to repay");

        // Cap repayment at current debt
        uint256 repayAmount = amount > debt ? debt : amount;

        // Transfer stablecoin from user to contract
        require(
            stablecoin.transferFrom(msg.sender, address(this), repayAmount),
            "Transfer failed"
        );

        // Update debt
        if (isUSDT) {
            position.borrowedUSDT = position.borrowedUSDT.sub(repayAmount);
        } else {
            position.borrowedUSDC = position.borrowedUSDC.sub(repayAmount);
        }

        emit LoanRepaid(msg.sender, address(stablecoin), repayAmount);
    }

    /**
     * @dev Liquidate an undercollateralized position
     * @param borrower Address of the borrower to liquidate
     */
    function liquidate(address borrower) external nonReentrant {
        LoanPosition storage position = loanPositions[borrower];
        require(position.collateralAmount > 0, "No collateral to liquidate");

        // Update interest
        updateInterest(borrower);

        // Check if position is liquidatable
        uint256 totalDebt = getTotalDebt(borrower);
        uint256 collateralValue = getCollateralValue(position.collateralAmount);

        require(
            collateralValue.mul(LIQUIDATION_THRESHOLD) < totalDebt.mul(10000),
            "Position not liquidatable"
        );

        // Calculate liquidation amount
        uint256 liquidationBonus = totalDebt.mul(LIQUIDATION_BONUS).div(10000);
        uint256 totalToLiquidator = totalDebt.add(liquidationBonus);

        // Convert USD value back to lstBTC amount
        uint256 lstBTCPrice = priceOracle.getPrice(address(lstBTCToken));
        uint256 lstBTCToLiquidator = totalToLiquidator.mul(1e18).div(
            lstBTCPrice
        );

        // Cap at available collateral
        if (lstBTCToLiquidator > position.collateralAmount) {
            lstBTCToLiquidator = position.collateralAmount;
        }

        // Reset position
        uint256 collateralLiquidated = position.collateralAmount;
        position.collateralAmount = 0;
        position.borrowedUSDT = 0;
        position.borrowedUSDC = 0;
        position.accumulatedInterest = 0;

        // Transfer owed stablecoins from liquidator to contract
        uint256 usdtToRepay = position.borrowedUSDT;
        uint256 usdcToRepay = position.borrowedUSDC;

        if (usdtToRepay > 0) {
            require(
                stablecoinUSDT.transferFrom(
                    msg.sender,
                    address(this),
                    usdtToRepay
                ),
                "USDT transfer failed"
            );
        }

        if (usdcToRepay > 0) {
            require(
                stablecoinUSDC.transferFrom(
                    msg.sender,
                    address(this),
                    usdcToRepay
                ),
                "USDC transfer failed"
            );
        }

        // Transfer lstBTC to liquidator
        require(
            lstBTCToken.transfer(msg.sender, lstBTCToLiquidator),
            "lstBTC transfer failed"
        );

        emit PositionLiquidated(borrower, msg.sender, collateralLiquidated);
    }

    /**
     * @dev Get collateral value in USD
     * @param collateralAmount Amount of lstBTC
     * @return Collateral value in USD (scaled by 1e18)
     */
    function getCollateralValue(
        uint256 collateralAmount
    ) public view returns (uint256) {
        uint256 lstBTCPrice = priceOracle.getPrice(address(lstBTCToken));
        return collateralAmount.mul(lstBTCPrice).div(1e18);
    }

    /**
     * @dev Get total debt (borrowed + interest)
     * @param user Address of the user
     * @return Total debt in USD (scaled by 1e18)
     */
    function getTotalDebt(address user) public view returns (uint256) {
        LoanPosition storage position = loanPositions[user];

        // Calculate interest since last update
        uint256 timeDelta = block.timestamp.sub(
            position.lastInterestCalcTimestamp > 0
                ? position.lastInterestCalcTimestamp
                : block.timestamp
        );
        uint256 totalBorrowed = position.borrowedUSDT.add(
            position.borrowedUSDC
        );

        uint256 newInterest = totalBorrowed
            .mul(INTEREST_RATE)
            .mul(timeDelta)
            .div(YEAR_IN_SECONDS)
            .div(10000);

        return totalBorrowed.add(position.accumulatedInterest).add(newInterest);
    }

    /**
     * @dev Update accumulated interest
     * @param user Address of the user
     */
    function updateInterest(address user) internal {
        LoanPosition storage position = loanPositions[user];
        if (position.lastInterestCalcTimestamp == 0) {
            position.lastInterestCalcTimestamp = block.timestamp;
            return;
        }

        uint256 timeDelta = block.timestamp.sub(
            position.lastInterestCalcTimestamp
        );
        if (timeDelta == 0) return;

        uint256 totalBorrowed = position.borrowedUSDT.add(
            position.borrowedUSDC
        );
        if (totalBorrowed == 0) return;

        uint256 newInterest = totalBorrowed
            .mul(INTEREST_RATE)
            .mul(timeDelta)
            .div(YEAR_IN_SECONDS)
            .div(10000);

        position.accumulatedInterest = position.accumulatedInterest.add(
            newInterest
        );
        position.lastInterestCalcTimestamp = block.timestamp;
    }

    /**
     * @dev Get max borrowable amount for a user
     * @param user Address of the user
     * @return Max borrowable amount in USD (scaled by 1e18)
     */
    function getMaxBorrowableAmount(
        address user
    ) external view returns (uint256) {
        LoanPosition storage position = loanPositions[user];
        uint256 collateralValue = getCollateralValue(position.collateralAmount);
        uint256 maxBorrowable = collateralValue.mul(LTV_RATIO).div(10000);
        uint256 currentDebt = getTotalDebt(user);

        return
            currentDebt >= maxBorrowable ? 0 : maxBorrowable.sub(currentDebt);
    }

    /**
     * @dev Get current loan-to-value ratio for a user
     * @param user Address of the user
     * @return LTV ratio scaled by 10000 (e.g., 7000 = 70%)
     */
    function getCurrentLTV(address user) external view returns (uint256) {
        uint256 totalDebt = getTotalDebt(user);
        if (totalDebt == 0) return 0;

        uint256 collateralValue = getCollateralValue(
            loanPositions[user].collateralAmount
        );
        if (collateralValue == 0) return 0;

        return totalDebt.mul(10000).div(collateralValue);
    }

    /**
     * @dev Withdraw excess stablecoins (only owner)
     * @param amount Amount to withdraw
     * @param isUSDT True for USDT, false for USDC
     */
    function withdrawExcessStablecoins(
        uint256 amount,
        bool isUSDT
    ) external onlyOwner {
        if (isUSDT) {
            require(
                stablecoinUSDT.transfer(msg.sender, amount),
                "Transfer failed"
            );
        } else {
            require(
                stablecoinUSDC.transfer(msg.sender, amount),
                "Transfer failed"
            );
        }
    }

    /**
     * @dev Update price oracle address
     */
    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @dev Update insurance pool address
     */
    function setInsurancePool(address _insurancePool) external onlyOwner {
        insurancePool = IBTCInsurancePool(_insurancePool);
    }
}
