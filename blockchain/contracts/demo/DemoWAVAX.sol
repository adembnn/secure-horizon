// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DemoWAVAX
 * @notice Simple wrapped AVAX mock for demo swaps on Fuji.
 *         18 decimals, free mint.
 *         ONLY FOR TEST NETWORKS - do not deploy on mainnet.
 */
contract DemoWAVAX is ERC20 {
    constructor() ERC20("Demo Wrapped AVAX", "DWAVAX") {}

    /**
     * @notice Free mint for demo purposes - anyone can mint tokens
     * @param to Recipient address
     * @param amount Amount in wei (18 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
