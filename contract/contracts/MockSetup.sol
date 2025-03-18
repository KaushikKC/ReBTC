// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Mock BTC Token
 * @dev Mock BTC token for testing purposes
 */
contract MockBTC is ERC20 {
    constructor() ERC20("BTC", "BTC") {
        _mint(msg.sender, 100 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title Mock Stablecoin
 * @dev Mock stablecoin for testing purposes
 */
contract MockStablecoin is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title Mock Lending Protocol
 * @dev Mock lending protocol for testing purposes
 */
contract MockLendingProtocol {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public apyRates;

    function deposit(address asset, uint256 amount) external returns (uint256) {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        deposits[asset] += amount;
        return amount;
    }

    function withdraw(
        address asset,
        uint256 amount
    ) external returns (uint256) {
        require(deposits[asset] >= amount, "Insufficient deposit");
        deposits[asset] -= amount;
        IERC20(asset).transfer(msg.sender, amount);
        return amount;
    }

    function getAPY(address asset) external view returns (uint256) {
        return apyRates[asset] > 0 ? apyRates[asset] : 500; // Default 5%
    }

    function setAPY(address asset, uint256 apy) external {
        apyRates[asset] = apy;
    }
}

/**
 * @title Mock Price Oracle
 * @dev Mock price oracle for testing purposes
 */
contract MockPriceOracle {
    mapping(address => uint256) public prices;

    // Set price with 18 decimals
    function setPrice(address asset, uint256 price) external {
        prices[asset] = price;
    }

    function getPrice(address asset) external view returns (uint256) {
        return prices[asset] > 0 ? prices[asset] : 30000 * 10 ** 18; // Default 30,000 USD
    }
}

/**
 * @title Time Controller
 * @dev Helper contract to manipulate time for testing purposes
 */
contract TimeController {
    function increaseTime(uint256 timeToIncrease) external {
        // This is a mock for testing purposes
        // In a real test environment, you would use:
        // vm.warp(block.timestamp + timeToIncrease);
    }
}
