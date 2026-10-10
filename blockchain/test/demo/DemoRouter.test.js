const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DemoRouter", function () {
  let usdc, wavax, router;
  let owner, alice;
  const LIQUIDITY_USDC = ethers.parseUnits("100000", 6); // 100k USDC
  const LIQUIDITY_WAVAX = ethers.parseEther("1000"); // 1000 WAVAX

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();

    // Deploy tokens
    const DemoUSDC = await ethers.getContractFactory("DemoUSDC");
    usdc = await DemoUSDC.deploy();

    const DemoWAVAX = await ethers.getContractFactory("DemoWAVAX");
    wavax = await DemoWAVAX.deploy();

    // Deploy router
    const DemoRouter = await ethers.getContractFactory("DemoRouter");
    router = await DemoRouter.deploy(
      await usdc.getAddress(),
      await wavax.getAddress()
    );

    // Seed liquidity
    await usdc.mint(owner.address, LIQUIDITY_USDC);
    await wavax.mint(owner.address, LIQUIDITY_WAVAX);
    await usdc.approve(await router.getAddress(), LIQUIDITY_USDC);
    await wavax.approve(await router.getAddress(), LIQUIDITY_WAVAX);
    await router.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_WAVAX);
  });

  describe("Constructor", function () {
    it("should set token addresses correctly", async function () {
      expect(await router.usdc()).to.equal(await usdc.getAddress());
      expect(await router.wavax()).to.equal(await wavax.getAddress());
    });

    it("should revert with zero addresses", async function () {
      const DemoRouter = await ethers.getContractFactory("DemoRouter");
      await expect(
        DemoRouter.deploy(ethers.ZeroAddress, await wavax.getAddress())
      ).to.be.revertedWith("Invalid token addresses");
    });
  });

  describe("swapUSDCforWAVAX", function () {
    it("should swap USDC for WAVAX at fixed rate", async function () {
      // Give alice some USDC
      const usdcAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      await usdc.mint(alice.address, usdcAmount);

      // Expected WAVAX: 1000 USDC * 1e12 / 100 = 10 WAVAX
      const expectedWavax = ethers.parseEther("10");

      // Approve and swap
      await usdc.connect(alice).approve(await router.getAddress(), usdcAmount);

      await expect(router.connect(alice).swapUSDCforWAVAX(usdcAmount, 0))
        .to.emit(router, "Swap")
        .withArgs(
          alice.address,
          await usdc.getAddress(),
          await wavax.getAddress(),
          usdcAmount,
          expectedWavax
        );

      // Verify balances - tokens go to msg.sender (legitimate behavior)
      expect(await usdc.balanceOf(alice.address)).to.equal(0);
      expect(await wavax.balanceOf(alice.address)).to.equal(expectedWavax);
    });

    it("should respect slippage protection", async function () {
      const usdcAmount = ethers.parseUnits("100", 6);
      await usdc.mint(alice.address, usdcAmount);
      await usdc.connect(alice).approve(await router.getAddress(), usdcAmount);

      // Expect 1 WAVAX but require 2 - should fail
      const tooMuch = ethers.parseEther("2");
      await expect(
        router.connect(alice).swapUSDCforWAVAX(usdcAmount, tooMuch)
      ).to.be.revertedWith("Slippage exceeded");
    });

    it("should only use bounded approval (not unlimited)", async function () {
      // This tests that the router uses exact amount, not max uint
      const usdcAmount = ethers.parseUnits("100", 6);
      await usdc.mint(alice.address, usdcAmount * 2n);

      // Approve only exact amount needed
      await usdc.connect(alice).approve(await router.getAddress(), usdcAmount);

      // First swap works
      await router.connect(alice).swapUSDCforWAVAX(usdcAmount, 0);

      // Second swap fails - no remaining allowance
      await expect(
        router.connect(alice).swapUSDCforWAVAX(usdcAmount, 0)
      ).to.be.reverted; // SafeERC20 will revert
    });
  });

  describe("swapWAVAXforUSDC", function () {
    it("should swap WAVAX for USDC at fixed rate", async function () {
      // Give alice some WAVAX
      const wavaxAmount = ethers.parseEther("10"); // 10 WAVAX
      await wavax.mint(alice.address, wavaxAmount);

      // Expected USDC: 10 WAVAX * 100 / 1e12 = 1000 USDC (but in 6 decimals)
      const expectedUsdc = ethers.parseUnits("1000", 6);

      // Approve and swap
      await wavax.connect(alice).approve(await router.getAddress(), wavaxAmount);

      await router.connect(alice).swapWAVAXforUSDC(wavaxAmount, 0);

      // Tokens go to msg.sender
      expect(await wavax.balanceOf(alice.address)).to.equal(0);
      expect(await usdc.balanceOf(alice.address)).to.equal(expectedUsdc);
    });
  });

  describe("Quote functions", function () {
    it("should calculate WAVAX for USDC correctly", async function () {
      const usdcIn = ethers.parseUnits("100", 6);
      const wavaxOut = await router.getWAVAXforUSDC(usdcIn);
      expect(wavaxOut).to.equal(ethers.parseEther("1"));
    });

    it("should calculate USDC for WAVAX correctly", async function () {
      const wavaxIn = ethers.parseEther("1");
      const usdcOut = await router.getUSDCforWAVAX(wavaxIn);
      expect(usdcOut).to.equal(ethers.parseUnits("100", 6));
    });
  });

  describe("Legitimate router vs drainer behavior", function () {
    it("should send output to msg.sender, not a third party", async function () {
      // Key difference: drainer sends to collector, router sends to user
      const usdcAmount = ethers.parseUnits("100", 6);
      await usdc.mint(alice.address, usdcAmount);
      await usdc.connect(alice).approve(await router.getAddress(), usdcAmount);

      const aliceBefore = await wavax.balanceOf(alice.address);
      await router.connect(alice).swapUSDCforWAVAX(usdcAmount, 0);
      const aliceAfter = await wavax.balanceOf(alice.address);

      // Alice receives the WAVAX (msg.sender = recipient)
      expect(aliceAfter).to.be.gt(aliceBefore);
    });
  });
});
