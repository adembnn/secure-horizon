const { ethers } = require("hardhat");
const assert = require("assert");

const SAFE_FACTORY = "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7"; // Safe singleton factory (present on Fuji)
const FORK = process.env.FORK === "1";
const Z = ethers.ZeroAddress;
const ONE = ethers.parseEther("1");

async function deployVia(fqn, signer, args = [], salt = 0) {
  const f = await ethers.getContractFactory(fqn, signer);
  const initCode = (await f.getDeployTransaction(...args)).data;
  if (FORK) {
    const code = await ethers.provider.getCode(SAFE_FACTORY);
    assert(code !== "0x", "Safe singleton factory missing on fork");
    const data = ethers.zeroPadValue(ethers.toBeHex(salt), 32) + initCode.slice(2);
    const addr = ethers.getCreate2Address(SAFE_FACTORY, ethers.zeroPadValue(ethers.toBeHex(salt), 32), ethers.keccak256(initCode));
    if ((await ethers.provider.getCode(addr)) === "0x") await (await signer.sendTransaction({ to: SAFE_FACTORY, data })).wait();
    return f.attach(addr);
  }
  const c = await f.deploy(...args); await c.waitForDeployment(); return c;
}

async function signTx(safe, wallets, to, value) {
  const h = await safe.getTransactionHash(to, value, "0x", 0, 0, 0, 0, Z, Z, await safe.nonce());
  const sorted = [...wallets].sort((a, b) => (BigInt(a.address) < BigInt(b.address) ? -1 : 1));
  return ethers.concat(sorted.map((w) => w.signingKey.sign(h).serialized)); // v=27/28 on raw hash
}
async function exec(safe, wallets, to, value, data = "0x") {
  const h = await safe.getTransactionHash(to, value, data, 0, 0, 0, 0, Z, Z, await safe.nonce());
  const sorted = [...wallets].sort((a, b) => (BigInt(a.address) < BigInt(b.address) ? -1 : 1));
  const sigs = ethers.concat(sorted.map((w) => w.signingKey.sign(h).serialized));
  return safe.execTransaction(to, value, data, 0, 0, 0, 0, Z, Z, sigs);
}

async function setupSafe(ver) {
  const [deployer] = await ethers.getSigners();
  const owners = [0, 1, 2].map(() => ethers.Wallet.createRandom().connect(ethers.provider)); // throwaway keys
  const single = await deployVia(`${ver}/contracts/Safe.sol:Safe`, deployer, [], ver === "s15" ? 15 : 141);
  const pf = await deployVia(`${ver}/contracts/proxies/SafeProxyFactory.sol:SafeProxyFactory`, deployer, [], ver === "s15" ? 15 : 141);
  const init = single.interface.encodeFunctionData("setup", [owners.map((o) => o.address), 2, Z, "0x", Z, Z, 0, Z]);
  const rc = await (await pf.createProxyWithNonce(await single.getAddress(), init, 1234)).wait();
  const ev = rc.logs.map((l) => { try { return pf.interface.parseLog(l); } catch { return null; } }).find((e) => e && e.name === "ProxyCreation");
  const safe = single.attach(ev.args.proxy);
  await deployer.sendTransaction({ to: ev.args.proxy, value: 10n * ONE });
  return { deployer, owners, safe, version: await safe.VERSION() };
}

for (const ver of ["s15", "s141"]) {
  describe(`Safe ${ver === "s15" ? "1.5.0" : "1.4.1"}${FORK ? " (Fuji fork, Safe singleton factory)" : " (local)"}`, function () {
    let ctx, guard, module, good, evil;
    before(async () => {
      ctx = await setupSafe(ver);
      good = ethers.Wallet.createRandom().address; // allowlisted treasury destination
      evil = ethers.Wallet.createRandom().address; // attacker destination (synthetic)
      const g = await ethers.getContractFactory("SentinelGuard", ctx.deployer);
      guard = await g.deploy(await ctx.safe.getAddress(), [good, await ctx.safe.getAddress()], ONE * 2n); // Safe itself allowlisted for admin self-calls
      const m = await ethers.getContractFactory("TestModule", ctx.deployer);
      module = await m.deploy();
      console.log(`    version=${ctx.version} safe=${await ctx.safe.getAddress()} threshold=${await ctx.safe.getThreshold()} owners=${(await ctx.safe.getOwners()).length}`);
    });

    it("2-of-3 Safe: Transaction Guard + enabled module", async () => {
      const s = ctx.safe, own = ctx.owners;
      assert.equal(await s.getThreshold(), 2n);
      await exec(s, [own[0], own[1]], await s.getAddress(), 0, s.interface.encodeFunctionData("setGuard", [await guard.getAddress()]));
      await exec(s, [own[1], own[2]], await s.getAddress(), 0, s.interface.encodeFunctionData("enableModule", [await module.getAddress()]));
      assert.equal(await s.isModuleEnabled(await module.getAddress()), true);
    });

    it("normal exit: allowlisted destination passes the Transaction Guard, attacker destination is blocked", async () => {
      const s = ctx.safe, own = ctx.owners;
      const before = await ethers.provider.getBalance(good);
      await exec(s, [own[0], own[2]], good, ONE / 2n);
      assert.equal((await ethers.provider.getBalance(good)) - before, ONE / 2n);
      assert.equal(await guard.txChecks(), 2n); // enableModule + payment (setGuard itself ran before the guard existed)
      await assert.rejects(exec(s, [own[0], own[1]], evil, ONE / 2n), /SENTINEL: destination not allowlisted/);
      assert.equal(await ethers.provider.getBalance(evil), 0n);
    });

    if (ver === "s15") {
      it("1.5.0: module exit is BLOCKED by the Module Guard (and allowed destinations still pass)", async () => {
        const s = ctx.safe, own = ctx.owners;
        // Before the module guard is set, a module drain to the attacker works: that is the 1.4.1-style hole.
        // (we do not run it here; the next test shows it explicitly on 1.4.1)
        await exec(s, [own[0], own[1]], await s.getAddress(), 0, s.interface.encodeFunctionData("setModuleGuard", [await guard.getAddress()]));
        const mod = await module.getAddress();
        await assert.rejects(module.drain(await s.getAddress(), evil, ONE), /SENTINEL: destination not allowlisted/);
        assert.equal(await ethers.provider.getBalance(evil), 0n, "attacker must receive nothing");
        const b = await ethers.provider.getBalance(good);
        await module.drain(await s.getAddress(), good, ONE / 4n);
        assert.equal((await ethers.provider.getBalance(good)) - b, ONE / 4n);
        assert.equal(await guard.moduleChecks(), 1n);
        console.log("    module->evil: reverted by Module Guard; module->allowlisted: passed (moduleChecks=1)");
      });
    } else {
      it("1.4.1: no Module Guard exists (setModuleGuard hits the fallback, nothing is stored)", async () => {
        const s = ctx.safe;
        await exec(s, [ctx.owners[0], ctx.owners[1]], await s.getAddress(), 0,
          ethers.id("setModuleGuard(address)").slice(0, 10) + ethers.zeroPadValue(await guard.getAddress(), 32).slice(2));
        const slot = "0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947"; // 1.5.0 module-guard slot
        assert.equal(BigInt(await ethers.provider.getStorage(await s.getAddress(), slot)), 0n);
      });
      it("1.4.1: module exit BYPASSES the Transaction Guard (attacker is paid)", async () => {
        const s = ctx.safe;
        assert.equal(await ethers.provider.getBalance(evil), 0n);
        await module.drain(await s.getAddress(), evil, ONE);
        assert.equal(await ethers.provider.getBalance(evil), ONE, "bypass observed");
        assert.equal(await guard.moduleChecks(), 0n);
        console.log("    module->evil: SUCCEEDED on 1.4.1 (guard never consulted)");
      });
    }
  });
}
