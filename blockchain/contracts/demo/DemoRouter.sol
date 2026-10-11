// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DemoRouter
 * @notice Minimal legitimate swap router for Sentinelle demo.
 *         Swaps DemoUSDC <-> DemoWAVAX at a fixed rate (1 WAVAX = 100 USDC).
 *         Key difference from drainer: bounded approval, sends to msg.sender.
 *         ONLY FOR TEST NETWORKS - do not deploy on mainnet.
 */
contract DemoRouter {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable wavax;

    // Fixed exchange rate: 1 WAVAX (18 dec) = 100 USDC (6 dec)
    // To swap X USDC to WAVAX: WAVAX out = X * 1e18 / (100 * 1e6) = X * 1e12 / 100
    // To swap Y WAVAX to USDC: USDC out = Y * 100 * 1e6 / 1e18 = Y * 100 / 1e12
    uint256 public constant RATE_USDC_PER_WAVAX = 100;

    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _usdc, address _wavax) {
        require(_usdc != address(0) && _wavax != address(0), "Invalid token addresses");
        usdc = IERC20(_usdc);
        wavax = IERC20(_wavax);
    }

    /**
     * @notice Swap exact USDC for WAVAX
     * @param amountIn Amount of USDC to swap (6 decimals)
     * @param minAmountOut Minimum WAVAX to receive (slippage protection)
     * @return amountOut Amount of WAVAX received (18 decimals)
     */
    function swapUSDCforWAVAX(uint256 amountIn, uint256 minAmountOut)
        external
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Amount must be > 0");

        // Calculate output: WAVAX = USDC * 1e12 / 100
        amountOut = (amountIn * 1e12) / RATE_USDC_PER_WAVAX;
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(wavax.balanceOf(address(this)) >= amountOut, "Insufficient liquidity");

        // Transfer USDC from user (requires prior approval - bounded amount)
        usdc.safeTransferFrom(msg.sender, address(this), amountIn);

        // Send WAVAX to user (msg.sender, not some other address)
        wavax.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, address(usdc), address(wavax), amountIn, amountOut);
    }

    /**
     * @notice Swap exact WAVAX for USDC
     * @param amountIn Amount of WAVAX to swap (18 decimals)
     * @param minAmountOut Minimum USDC to receive (slippage protection)
     * @return amountOut Amount of USDC received (6 decimals)
     */
    function swapWAVAXforUSDC(uint256 amountIn, uint256 minAmountOut)
        external
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Amount must be > 0");

        // Calculate output: USDC = WAVAX * 100 / 1e12
        amountOut = (amountIn * RATE_USDC_PER_WAVAX) / 1e12;
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(usdc.balanceOf(address(this)) >= amountOut, "Insufficient liquidity");

        // Transfer WAVAX from user (requires prior approval - bounded amount)
        wavax.safeTransferFrom(msg.sender, address(this), amountIn);

        // Send USDC to user (msg.sender)
        usdc.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, address(wavax), address(usdc), amountIn, amountOut);
    }

    /**
     * @notice Add liquidity to the router (for demo setup)
     * @param usdcAmount Amount of USDC to deposit
     * @param wavaxAmount Amount of WAVAX to deposit
     */
    function addLiquidity(uint256 usdcAmount, uint256 wavaxAmount) external {
        if (usdcAmount > 0) {
            usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        }
        if (wavaxAmount > 0) {
            wavax.safeTransferFrom(msg.sender, address(this), wavaxAmount);
        }
    }

    /**
     * @notice Get expected output for a USDC -> WAVAX swap
     */
    function getWAVAXforUSDC(uint256 usdcAmount) external pure returns (uint256) {
        return (usdcAmount * 1e12) / RATE_USDC_PER_WAVAX;
    }

    /**
     * @notice Get expected output for a WAVAX -> USDC swap
     */
    function getUSDCforWAVAX(uint256 wavaxAmount) external pure returns (uint256) {
        return (wavaxAmount * RATE_USDC_PER_WAVAX) / 1e12;
    }
}
