// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title DemoNFT
 * @notice Minimal ERC-721 for testing setApprovalForAll drainer scenarios.
 *         Free mint, auto-increment token IDs.
 *         ONLY FOR TEST NETWORKS - do not deploy on mainnet.
 */
contract DemoNFT is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("Demo NFT", "DNFT") {}

    /**
     * @notice Free mint for demo purposes - anyone can mint an NFT
     * @param to Recipient address
     * @return tokenId The minted token ID
     */
    function mint(address to) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _mint(to, tokenId);
    }

    /**
     * @notice Batch mint multiple NFTs
     * @param to Recipient address
     * @param count Number of NFTs to mint
     * @return firstTokenId The first minted token ID
     */
    function mintBatch(address to, uint256 count) external returns (uint256 firstTokenId) {
        firstTokenId = _nextTokenId;
        for (uint256 i = 0; i < count; i++) {
            _mint(to, _nextTokenId++);
        }
    }
}
