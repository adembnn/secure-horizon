// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Hold up Lab - extra contracts the ground-truth scenarios need and that blockchain/contracts/demo does not have.
// ONLY FOR THE LOCAL LAB CHAIN (127.0.0.1). Compiled at lab start with the solc shipped in blockchain/node_modules.

interface IERC20L {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

/// A contract the victim owns (a small treasury). Whoever is `owner` can empty it.
contract LabVault {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        require(IERC20L(token).transfer(to, amount), "transfer failed");
    }
}

/// An unknown router with the Uniswap V2 entry point. It keeps what it is given (sent to `operator`) and pays
/// `payoutBps` of the fair demo rate (1 WAVAX = 100 USDC) to `to`. With amountOutMin = 0 the caller gets almost nothing.
contract LabShadyRouter {
    address public immutable operator;
    uint256 public immutable payoutBps;

    constructor(address operator_, uint256 payoutBps_) {
        operator = operator_;
        payoutBps = payoutBps_;
    }

    function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        returns (uint256[] memory amounts)
    {
        require(block.timestamp <= deadline, "EXPIRED");
        require(path.length >= 2, "INVALID_PATH");
        require(IERC20L(path[0]).transferFrom(msg.sender, operator, amountIn), "transferFrom failed");
        uint256 out = (((amountIn * 1e12) / 100) * payoutBps) / 10000;
        require(out >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");
        if (out > 0) require(IERC20L(path[path.length - 1]).transfer(to, out), "payout failed");
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = out;
    }
}

/// Wrapped native coin (WETH9 shape), used only when the lab runs offline (no fork, so no real WAVAX).
contract LabWAVAX {
    string public constant name = "Wrapped AVAX (lab)";
    string public constant symbol = "WAVAX";
    uint8 public constant decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 wad) external {
        balanceOf[msg.sender] -= wad;
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }

    function approve(address spender, uint256 wad) external returns (bool) {
        allowance[msg.sender][spender] = wad;
        emit Approval(msg.sender, spender, wad);
        return true;
    }

    function transfer(address to, uint256 wad) external returns (bool) {
        return transferFrom(msg.sender, to, wad);
    }

    function transferFrom(address from, address to, uint256 wad) public returns (bool) {
        if (from != msg.sender && allowance[from][msg.sender] != type(uint256).max) allowance[from][msg.sender] -= wad;
        balanceOf[from] -= wad;
        balanceOf[to] += wad;
        emit Transfer(from, to, wad);
        return true;
    }
}
