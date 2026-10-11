// SPDX-License-Identifier: MIT
// SYNTHETIC test contracts for the local fork tests of detectors_adem (never deployed on a public chain).
pragma solidity ^0.8.20;

contract TestToken {
    string public symbol;
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;              // slot 2 (after symbol, decimals)
    mapping(address => mapping(address => uint256)) public allowance;
    address public owner;
    uint256 public sellTaxBps;      // tax taken on transfers TO the pool
    bool public honeypot;           // transfers TO the pool revert for everyone but the owner
    address public pool;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory s, bool hp, uint256 taxBps, address p) { symbol = s; honeypot = hp; sellTaxBps = taxBps; pool = p; owner = msg.sender; balanceOf[msg.sender] = 1e30; }
    function _move(address f, address t, uint256 v) internal {
        if (t == pool && f != owner) {
            require(!honeypot, "TRADING_DISABLED");
            uint256 tax = v * sellTaxBps / 10000;
            balanceOf[f] -= v; balanceOf[t] += v - tax; balanceOf[owner] += tax;
            emit Transfer(f, t, v - tax); if (tax > 0) emit Transfer(f, owner, tax);
            return;
        }
        balanceOf[f] -= v; balanceOf[t] += v; emit Transfer(f, t, v);
    }
    function transfer(address t, uint256 v) external returns (bool) { _move(msg.sender, t, v); return true; }
    function approve(address s, uint256 v) external returns (bool) { allowance[msg.sender][s] = v; emit Approval(msg.sender, s, v); return true; }
    function transferFrom(address f, address t, uint256 v) external returns (bool) {
        uint256 a = allowance[f][msg.sender];
        if (a != type(uint256).max) { require(a >= v, "ALLOWANCE"); allowance[f][msg.sender] = a - v; }
        _move(f, t, v); return true;
    }
}

// Minimal Multicall3.aggregate3 (same selector and ABI as the public Multicall3).
contract MiniMulticall3 {
    struct Call3 { address target; bool allowFailure; bytes callData; }
    struct Result { bool success; bytes returnData; }
    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory r) {
        r = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok, bytes memory ret) = calls[i].target.call(calls[i].callData);
            require(ok || calls[i].allowFailure, "CALL_FAILED");
            r[i] = Result(ok, ret);
        }
    }
}

// "Claim" contract with an unregistered selector : it secretly pulls the caller's tokens using an allowance granted earlier.
contract FakeClaim {
    address public immutable sink;
    constructor(address s) { sink = s; }
    function claimRewards(address token) external {
        uint256 b = TestToken(token).balanceOf(msg.sender);
        TestToken(token).transferFrom(msg.sender, sink, b);
    }
}
