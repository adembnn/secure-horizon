const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DemoUSDC", function () {
  let usdc;
  let owner, alice;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const DemoUSDC = await ethers.getContractFactory("DemoUSDC");
    usdc = await DemoUSDC.deploy();
    await usdc.waitForDeployment();
  });

  it("should have correct name, symbol and decimals", async function () {
    expect(await usdc.name()).to.equal("Demo USDC");
    expect(await usdc.symbol()).to.equal("DUSDC");
    expect(await usdc.decimals()).to.equal(6);
  });

  it("should allow free minting", async function () {
    const amount = ethers.parseUnits("1000", 6);
    await usdc.mint(alice.address, amount);
    expect(await usdc.balanceOf(alice.address)).to.equal(amount);
  });

  it("should support EIP-2612 permit", async function () {
    // Mint tokens to alice
    const amount = ethers.parseUnits("1000", 6);
    await usdc.mint(alice.address, amount);

    // Build permit signature
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const nonce = await usdc.nonces(alice.address);
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
      owner: alice.address,
      spender: owner.address,
      value: amount,
      nonce: nonce,
      deadline: deadline,
    };

    const signature = await alice.signTypedData(domain, types, value);
    const { v, r, s } = ethers.Signature.from(signature);

    // Execute permit
    await usdc.permit(alice.address, owner.address, amount, deadline, v, r, s);

    // Check allowance
    expect(await usdc.allowance(alice.address, owner.address)).to.equal(amount);
  });
});

describe("DemoNFT", function () {
  let nft;
  let owner, alice;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const DemoNFT = await ethers.getContractFactory("DemoNFT");
    nft = await DemoNFT.deploy();
    await nft.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await nft.name()).to.equal("Demo NFT");
    expect(await nft.symbol()).to.equal("DNFT");
  });

  it("should allow free minting with auto-increment IDs", async function () {
    await nft.mint(alice.address);
    await nft.mint(alice.address);
    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await nft.ownerOf(1)).to.equal(alice.address);
    expect(await nft.balanceOf(alice.address)).to.equal(2);
  });

  it("should support batch minting", async function () {
    await nft.mintBatch(alice.address, 3);
    expect(await nft.balanceOf(alice.address)).to.equal(3);
    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await nft.ownerOf(2)).to.equal(alice.address);
  });
});

describe("DemoWAVAX", function () {
  let wavax;
  let owner, alice;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const DemoWAVAX = await ethers.getContractFactory("DemoWAVAX");
    wavax = await DemoWAVAX.deploy();
    await wavax.waitForDeployment();
  });

  it("should have correct name, symbol and 18 decimals", async function () {
    expect(await wavax.name()).to.equal("Demo Wrapped AVAX");
    expect(await wavax.symbol()).to.equal("DWAVAX");
    expect(await wavax.decimals()).to.equal(18);
  });

  it("should allow free minting", async function () {
    const amount = ethers.parseEther("100");
    await wavax.mint(alice.address, amount);
    expect(await wavax.balanceOf(alice.address)).to.equal(amount);
  });
});
