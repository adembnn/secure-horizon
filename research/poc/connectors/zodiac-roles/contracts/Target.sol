// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// Synthetic target contract for the proof. Only the Safe may call the
/// privileged functions, so any refusal seen when the sentinel goes through
/// Roles comes from Roles, not from this contract.
contract Target {
    address public immutable safe;
    uint256 public cap = 1000;
    uint256 public tightenCalls;
    uint256 public relaxCalls;

    constructor(address _safe) { safe = _safe; }

    modifier onlySafe() { require(msg.sender == safe, "Target: only Safe"); _; }

    /// Lowers the withdrawal cap: the one action the sentinel is allowed.
    function tighten(uint256 newCap) external onlySafe {
        require(newCap < cap, "Target: must lower cap");
        cap = newCap; tightenCalls++;
    }
    /// Raises the cap: must stay out of reach of the sentinel.
    function relax(uint256 newCap) external onlySafe { cap = newCap; relaxCalls++; }
}
