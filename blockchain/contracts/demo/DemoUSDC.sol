// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title DemoUSDC
 * @notice Synthetic USDC for demo/testing on Fuji.
 *         6 decimals, free mint, EIP-2612 permit support.
 *         ONLY FOR TEST NETWORKS - do not deploy on mainnet.
 */
contract DemoUSDC is ERC20, ERC20Permit {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("Demo USDC", "DUSDC") ERC20Permit("Demo USDC") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Free mint for demo purposes - anyone can mint tokens
     * @param to Recipient address
     * @param amount Amount in smallest units (6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
