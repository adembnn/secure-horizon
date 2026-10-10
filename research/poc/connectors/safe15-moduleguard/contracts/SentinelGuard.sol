// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

enum Operation { Call, DelegateCall }

// Same policy for both hooks: only allowlisted destinations, value capped.
// checkTransaction (0xe6d7a83a) = Safe Transaction Guard (1.3.0+).
// checkModuleTransaction (0x58401ed8) = Safe Module Guard (1.5.0 only).
contract SentinelGuard {
    address public immutable safe;
    mapping(address => bool) public allowed;
    uint256 public immutable cap;
    uint256 public txChecks;
    uint256 public moduleChecks;

    constructor(address _safe, address[] memory _allowed, uint256 _cap) {
        safe = _safe; cap = _cap;
        for (uint256 i; i < _allowed.length; i++) allowed[_allowed[i]] = true;
    }

    function _policy(address to, uint256 value, Operation op) internal view {
        require(op == Operation.Call, "SENTINEL: delegatecall forbidden");
        require(allowed[to], "SENTINEL: destination not allowlisted");
        require(value <= cap, "SENTINEL: above cap");
    }

    // ---- Transaction Guard
    function checkTransaction(address to, uint256 value, bytes memory, Operation op, uint256, uint256, uint256,
        address, address payable, bytes memory, address) external {
        _policy(to, value, op);
        txChecks++;
    }
    function checkAfterExecution(bytes32, bool) external {}

    // ---- Module Guard (1.5.0)
    function checkModuleTransaction(address to, uint256 value, bytes memory, Operation op, address)
        external returns (bytes32) {
        _policy(to, value, op);
        moduleChecks++;
        return bytes32(0);
    }
    function checkAfterModuleExecution(bytes32, bool) external {}

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0xe6d7a83a || id == 0x58401ed8 || id == 0x01ffc9a7;
    }
}

interface ISafeMod {
    function execTransactionFromModule(address to, uint256 value, bytes memory data, Operation op) external returns (bool);
}

// Minimal "test module": anyone can ask it to push funds out of the Safe (models a compromised/over-privileged module).
contract TestModule {
    function drain(address safe, address payable to, uint256 amount) external returns (bool) {
        return ISafeMod(safe).execTransactionFromModule(to, amount, "", Operation.Call);
    }
}
