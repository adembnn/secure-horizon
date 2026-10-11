const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

// Address-poisoning prop (research/demo_reelle/chain/lookalike.mjs) on the in-process Hardhat chain.
// Files go to a temp dir (HOLDUP_CHAIN_OUT_DIR): the live addresses files are never touched.
describe("Lookalike (address poisoning prop)", function () {
  this.timeout(600000);
  let lib, look, tmp;

  before(async function () {
    const dir = path.join(__dirname, "..", "..", "..", "research", "demo_reelle", "chain");
    lib = await import(pathToFileURL(path.join(dir, "lib.mjs")).href);
    look = await import(pathToFileURL(path.join(dir, "lookalike.mjs")).href);
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "holdup-lookalike-"));
    process.env.HOLDUP_CHAIN_OUT_DIR = tmp;
  });
  after(function () {
    delete process.env.HOLDUP_CHAIN_OUT_DIR;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("refuses any network other than local and fuji", function () {
    expect(() => lib.parseNetwork([])).to.throw(/explicitly/);
    expect(() => lib.parseNetwork(["--network", "mainnet"])).to.throw(/explicitly/);
    expect(lib.parseNetwork(["--network", "local"])).to.equal("local");
    expect(lib.parseNetwork(["--network", "fuji"])).to.equal("fuji");
  });

  it("mines a 3+3 lookalike, sends the dust, writes addresses and context", async function () {
    const [deployer, victim] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("DemoUSDC")).deploy();
    await usdc.waitForDeployment();
    await usdc.mint(victim.address, lib.VICTIM_AMOUNT);
    const addresses = {
      chainId: Number((await ethers.provider.getNetwork()).chainId),
      rpcUrl: "http://127.0.0.1:8545",
      mode: "plain",
      usdc: await usdc.getAddress(),
      victim: victim.address,
      deployer: deployer.address,
    };
    const ctx = { provider: ethers.provider, addresses, kind: "local", isLocal: true, isFuji: false, equivalent: false };

    const res = await look.runLookalike(ctx, deployer, {});

    const c = res.contact.toLowerCase().slice(2);
    const l = res.lookalike.toLowerCase().slice(2);
    expect(l.slice(0, 3)).to.equal(c.slice(0, 3));
    expect(l.slice(-3)).to.equal(c.slice(-3));
    expect(l).to.not.equal(c);

    // dust received by the victim, contact present in the victim's history, balance of the victim intact
    expect(await usdc.balanceOf(res.lookalike)).to.equal(0n);
    expect(await usdc.balanceOf(res.contact)).to.equal(look.PAST_TRANSFER);
    expect(await usdc.balanceOf(victim.address)).to.equal(lib.VICTIM_AMOUNT + look.DUST);
    const logs = await usdc.queryFilter(usdc.filters.Transfer(res.lookalike, victim.address));
    expect(logs).to.have.length(1);
    expect(logs[0].args.value).to.equal(look.DUST);

    // files: addresses (contact + lookalike, no key anywhere) and the product's context shape
    const a = JSON.parse(fs.readFileSync(path.join(tmp, "addresses.local.json"), "utf8"));
    expect(a.contact).to.equal(res.contact);
    expect(a.lookalike).to.equal(res.lookalike);
    const ctxFile = JSON.parse(fs.readFileSync(path.join(tmp, "context.local.json"), "utf8"));
    expect(ctxFile.contacts).to.deep.equal([{ label: "Paul", address: res.contact }]);
    expect(ctxFile.history.find((h) => h.address === res.contact).direction).to.equal("sortie");
    const dust = ctxFile.history.find((h) => h.address === res.lookalike);
    expect(dust.direction).to.equal("entree");
    expect(Number(dust.amount)).to.be.at.most(0.01);
    for (const f of fs.readdirSync(tmp)) {
      expect(fs.readFileSync(path.join(tmp, f), "utf8")).to.not.match(/[0-9a-f]{64}/i);
    }
  });
});
