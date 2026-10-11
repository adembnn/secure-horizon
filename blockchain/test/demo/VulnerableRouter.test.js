const { expect } = require("chai");
const { ethers } = require("hardhat");

// VulnerableRouter : routeur honnête d'apparence, mais sa fonction execute() non protégée
// permet à un tiers de vider, par transferFrom, les droits que les utilisateurs lui ont donnés.
// Ces tests prouvent la thèse de Hold up : un droit ILLIMITÉ est entièrement vidable le jour de
// la compromission ; un droit LIMITÉ puis consommé par l'échange ne laisse rien à prendre.
describe("VulnerableRouter", function () {
  let usdc, wavax, router;
  let owner, victim, attacker;
  const MAX = ethers.MaxUint256;
  const START = ethers.parseUnits("100", 6); // 100 DUSDC
  const SWAP = ethers.parseUnits("50", 6); // échange de 50
  const LIQ_U = ethers.parseUnits("100000", 6);
  const LIQ_W = ethers.parseEther("1000");

  const ERC20 = ["function transferFrom(address,address,uint256) returns (bool)"];
  const iface = new ethers.Interface(ERC20);

  beforeEach(async function () {
    [owner, victim, attacker] = await ethers.getSigners();
    const U = await ethers.getContractFactory("DemoUSDC");
    usdc = await U.deploy();
    const W = await ethers.getContractFactory("DemoWAVAX");
    wavax = await W.deploy();
    const R = await ethers.getContractFactory("VulnerableRouter");
    router = await R.deploy(await usdc.getAddress(), await wavax.getAddress());

    await usdc.mint(owner.address, LIQ_U);
    await wavax.mint(owner.address, LIQ_W);
    await usdc.approve(await router.getAddress(), LIQ_U);
    await wavax.approve(await router.getAddress(), LIQ_W);
    await router.addLiquidity(LIQ_U, LIQ_W);

    await usdc.mint(victim.address, START);
  });

  function drainCalldata(from, to, amount) {
    return iface.encodeFunctionData("transferFrom", [from, to, amount]);
  }

  it("échange honnêtement USDC contre WAVAX", async function () {
    await usdc.connect(victim).approve(await router.getAddress(), SWAP);
    await router.connect(victim).swapUSDCforWAVAX(SWAP, 0);
    expect(await usdc.balanceOf(victim.address)).to.equal(START - SWAP); // 50 restants
    expect(await wavax.balanceOf(victim.address)).to.be.gt(0);
  });

  describe("faille execute() : droit ILLIMITÉ (sans Hold up)", function () {
    it("après l'échange, un tiers vide le reste du compte", async function () {
      // 1) droit illimité au routeur, puis échange de 50
      await usdc.connect(victim).approve(await router.getAddress(), MAX);
      await router.connect(victim).swapUSDCforWAVAX(SWAP, 0);
      expect(await usdc.balanceOf(victim.address)).to.equal(START - SWAP); // 50
      // le droit illimité n'est pas consommé par l'échange
      expect(await usdc.allowance(victim.address, await router.getAddress())).to.equal(MAX);

      // 2) compromission : l'attaquant fait exécuter au routeur un transferFrom sur la victime
      const remaining = await usdc.balanceOf(victim.address);
      await expect(
        router
          .connect(attacker)
          .execute(await usdc.getAddress(), drainCalldata(victim.address, attacker.address, remaining))
      ).to.emit(router, "Exploited");

      expect(await usdc.balanceOf(victim.address)).to.equal(0); // compte vidé
      expect(await usdc.balanceOf(attacker.address)).to.equal(SWAP); // 50 volés en plus de l'échange
    });
  });

  describe("faille execute() : droit LIMITÉ à 50 (ce que fait Hold up)", function () {
    it("l'échange consomme tout le droit, le tiers ne prend rien", async function () {
      // 1) droit limité à 50 (réécriture de Hold up), puis échange de 50
      await usdc.connect(victim).approve(await router.getAddress(), SWAP);
      await router.connect(victim).swapUSDCforWAVAX(SWAP, 0);
      expect(await usdc.balanceOf(victim.address)).to.equal(START - SWAP); // 50
      // droit entièrement consommé
      expect(await usdc.allowance(victim.address, await router.getAddress())).to.equal(0);

      // 2) même compromission : le transferFrom échoue, le droit restant est nul
      await expect(
        router
          .connect(attacker)
          .execute(await usdc.getAddress(), drainCalldata(victim.address, attacker.address, START - SWAP))
      ).to.be.revertedWith("call failed");

      expect(await usdc.balanceOf(victim.address)).to.equal(START - SWAP); // 50 intacts
      expect(await usdc.balanceOf(attacker.address)).to.equal(0); // rien volé
    });
  });

  it("execute() refuse quand l'appel interne échoue (pas de droit)", async function () {
    await expect(
      router
        .connect(attacker)
        .execute(await usdc.getAddress(), drainCalldata(victim.address, attacker.address, START))
    ).to.be.revertedWith("call failed");
  });
});
