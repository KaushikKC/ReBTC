// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title IBTCInsurancePool
 * @dev Interface for the BTC Insurance Pool contract
 */
interface IBTCInsurancePool {
    function depositToPool(uint256 _amount) external;
}

/**
 * @title SimplifiedLstBtcFlashloan
 * @dev Direct exchange of lstBTC for stablecoins with a fee
 */
contract SimplifiedLstBtcFlashloan is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    IERC20 public lstBtcToken;
    IERC20 public usdtToken;
    IERC20 public usdcToken;
    IBTCInsurancePool public insurancePool;

    // Fee percentage (30% = 3000 basis points)
    uint256 public feePercentage = 3000;

    // Total fees collected
    uint256 public totalFeesCollected;

    // Events
    event Exchange(
        address indexed user,
        uint256 lstBtcAmount,
        uint256 stablecoinAmount,
        address stablecoinUsed
    );
    event StablecoinLiquidityAdded(
        address indexed provider,
        uint256 amount,
        address stablecoinUsed
    );
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event InsurancePoolFunded(uint256 amount);

    /**
     * @dev Constructor initializes the contract with token addresses
     * @param _owner The owner of the contract
     * @param _lstBtcToken The address of the lstBTC token
     * @param _usdtToken The address of the USDT token
     * @param _usdcToken The address of the USDC token
     * @param _insurancePoolAddress The address of the insurance pool
     */
    constructor(
        address _owner,
        address _lstBtcToken,
        address _usdtToken,
        address _usdcToken,
        address _insurancePoolAddress
    ) Ownable(_owner) {
        require(_lstBtcToken != address(0), "lstBTC address cannot be zero");
        require(_usdtToken != address(0), "USDT address cannot be zero");
        require(_usdcToken != address(0), "USDC address cannot be zero");
        require(
            _insurancePoolAddress != address(0),
            "Insurance pool address cannot be zero"
        );

        lstBtcToken = IERC20(_lstBtcToken);
        usdtToken = IERC20(_usdtToken);
        usdcToken = IERC20(_usdcToken);
        insurancePool = IBTCInsurancePool(_insurancePoolAddress);
    }

    /**
     * @dev Exchange lstBTC for stablecoins
     * @param lstBtcAmount Amount of lstBTC to provide (must be 1.3 units)
     * @param useUsdt Whether to receive USDT (true) or USDC (false)
     */
    function exchangeLstBtcForStablecoin(
        uint256 lstBtcAmount,
        bool useUsdt
    ) external nonReentrant {
        // Determine which stablecoin to use
        IERC20 stablecoin = useUsdt ? usdtToken : usdcToken;

        // Calculate stablecoin amount (1 unit for every 1.3 lstBTC)
        uint256 stablecoinAmount = lstBtcAmount.mul(10).div(13);

        // Check available stablecoin liquidity
        uint256 availableLiquidity = stablecoin.balanceOf(address(this));
        require(
            availableLiquidity >= stablecoinAmount,
            "Insufficient stablecoin liquidity"
        );

        // Transfer lstBTC from user to this contract
        require(
            lstBtcToken.transferFrom(msg.sender, address(this), lstBtcAmount),
            "lstBTC transfer failed"
        );

        // Approve insurance pool to take lstBTC from this contract
        lstBtcToken.approve(address(insurancePool), lstBtcAmount);

        // Call depositToPool on the insurance contract
        insurancePool.depositToPool(lstBtcAmount);

        // Transfer stablecoin to user
        require(
            stablecoin.transfer(msg.sender, stablecoinAmount),
            "Stablecoin transfer failed"
        );

        // Update fees collected (0.3 lstBTC per 1 stablecoin)
        uint256 feeAmount = lstBtcAmount.mul(3).div(13);
        totalFeesCollected = totalFeesCollected.add(feeAmount);

        emit Exchange(
            msg.sender,
            lstBtcAmount,
            stablecoinAmount,
            address(stablecoin)
        );
        emit InsurancePoolFunded(lstBtcAmount);
    }

    /**
     * @dev Add stablecoin liquidity to the contract
     * @param amount Amount of stablecoins to add
     * @param useUsdt Whether to add USDT (true) or USDC (false)
     */
    function addStablecoinLiquidity(uint256 amount, bool useUsdt) external {
        require(amount > 0, "Amount must be greater than 0");

        IERC20 stablecoin = useUsdt ? usdtToken : usdcToken;

        // Transfer tokens from user to this contract
        require(
            stablecoin.transferFrom(msg.sender, address(this), amount),
            "Stablecoin transfer failed"
        );

        emit StablecoinLiquidityAdded(msg.sender, amount, address(stablecoin));
    }

    /**
     * @dev Withdraw stablecoins from the contract (owner only)
     * @param amount Amount of stablecoins to withdraw
     * @param useUsdt Whether to withdraw USDT (true) or USDC (false)
     */
    function withdrawStablecoin(
        uint256 amount,
        bool useUsdt
    ) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        IERC20 stablecoin = useUsdt ? usdtToken : usdcToken;
        require(
            stablecoin.balanceOf(address(this)) >= amount,
            "Insufficient stablecoin balance"
        );

        // Transfer stablecoins to owner
        require(
            stablecoin.transfer(owner(), amount),
            "Stablecoin transfer failed"
        );
    }

    /**
     * @dev Update the insurance pool address
     * @param _insurancePoolAddress New insurance pool address
     */
    function updateInsurancePoolAddress(
        address _insurancePoolAddress
    ) external onlyOwner {
        require(
            _insurancePoolAddress != address(0),
            "Insurance pool address cannot be zero"
        );
        insurancePool = IBTCInsurancePool(_insurancePoolAddress);
    }

    /**
     * @dev Update the fee percentage
     * @param _feePercentage New fee percentage in basis points
     */
    function updateFeePercentage(uint256 _feePercentage) external onlyOwner {
        feePercentage = _feePercentage;
    }

    /**
     * @dev Get available liquidity of a specific stablecoin
     * @param useUsdt Whether to check USDT (true) or USDC (false)
     * @return Available liquidity
     */
    function getAvailableStablecoinLiquidity(
        bool useUsdt
    ) public view returns (uint256) {
        IERC20 stablecoin = useUsdt ? usdtToken : usdcToken;
        return stablecoin.balanceOf(address(this));
    }

    /**
     * @dev Emergency function to recover any tokens accidentally sent to the contract
     * @param tokenAddress Address of the token to recover
     * @param amount Amount to recover
     */
    function recoverToken(
        address tokenAddress,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        IERC20 token = IERC20(tokenAddress);
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );
        require(token.transfer(owner(), amount), "Token transfer failed");
    }
}
