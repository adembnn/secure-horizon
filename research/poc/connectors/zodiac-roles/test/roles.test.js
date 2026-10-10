const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

const ROLE = ethers.id("sentinelle"); // bytes32 role key
const TIGHTEN = ethers.id("tighten(uint256)").slice(0, 10);
const Op = { Call: 0, DelegateCall: 1 };
const ExecOpt = { None: 0 };

describe("Zodiac Roles v2 on a Safe: sentinel may call tighten() only", function () {
  let owner, sentinel, stranger, safe, roles, target;

  // Execute a tx from the Safe (threshold 1, owner = `owner`, pre-validated signature v=1).
  async function safeExec(to, data) {
    const sig = ethers.concat([ethers.zeroPadValue(owner.address, 32), ethers.ZeroHash, "0x01"]);
    const tx = await safe.connect(owner).execTransaction(to, 0, data, 0, 0, 0, 0, ethers.ZeroAddress, ethers.ZeroAddress, sig);
    return (await tx.wait());
  }

  before(async () => {
    [owner, sentinel, stranger] = await ethers.getSigners();

    // 1. Real Safe 1.4.1 (singleton + proxy factory), 1 owner, threshold 1
    const Singleton = await (await ethers.getContractFactory("Safe")).deploy();
    const Factory = await (await ethers.getContractFactory("SafeProxyFactory")).deploy();
    const setup = Singleton.interface.encodeFunctionData("setup", [[owner.address], 1, ethers.ZeroAddress, "0x", ethers.ZeroAddress, ethers.ZeroAddress, 0, ethers.ZeroAddress]);
    const rc = await (await Factory.createProxyWithNonce(await Singleton.getAddress(), setup, 42n)).wait();
    const ev = rc.logs.map((l) => { try { return Factory.interface.parseLog(l); } catch { return null; } }).find((e) => e && e.name === "ProxyCreation");
    safe = await ethers.getContractAt("Safe", ev.args.proxy);
    await owner.sendTransaction({ to: await safe.getAddress(), value: ethers.parseEther("1") });
    assert.equal(await safe.getThreshold(), 1n);

    // 2. Roles v2 (library-linked), owner = avatar = target = Safe
    const safeAddr = await safe.getAddress();
    if (process.env.OFFICIAL) {
      // Official released Roles v2.1.0 creation bytecode (from gnosisguild mastercopies.json).
      // Its libraries are pre-linked to the official mainnet addresses: put the
      // library runtime code at those addresses, then deploy Roles for real
      // with the EVM 24576-byte code-size limit ENFORCED (no allowUnlimitedContractSize).
      const m = require("../mastercopies.json");
      for (const lib of ["Integrity", "Packer"]) {
        const e = m[lib]["2.1.0"];
        const tmp = await owner.sendTransaction({ data: e.bytecode });
        const code = await ethers.provider.getCode((await tmp.wait()).contractAddress);
        await ethers.provider.send("hardhat_setCode", [e.address, code]);
      }
      const e = m.Roles["2.1.0"];
      const args = ethers.AbiCoder.defaultAbiCoder().encode(["address", "address", "address"], [safeAddr, safeAddr, safeAddr]);
      const rtx = await owner.sendTransaction({ data: e.bytecode + args.slice(2) });
      const raddr = (await rtx.wait()).contractAddress;
      const size = (await ethers.provider.getCode(raddr)).length / 2 - 1;
      console.log(`      OFFICIAL Roles v2.1.0 runtime size: ${size} bytes (limit 24576)`);
      assert.ok(size <= 24576);
      roles = await ethers.getContractAt("Roles", raddr);
    } else {
      const Integrity = await (await ethers.getContractFactory("Integrity")).deploy();
      const Packer = await (await ethers.getContractFactory("Packer")).deploy();
      const Roles = await ethers.getContractFactory("Roles", { libraries: { Integrity: await Integrity.getAddress(), Packer: await Packer.getAddress() } });
      roles = await Roles.deploy(safeAddr, safeAddr, safeAddr);
      await roles.waitForDeployment();
    }

    // 3. Target contract controlled by the Safe
    target = await (await ethers.getContractFactory("Target")).deploy(await safe.getAddress());

    // 4. The Safe configures itself (all through Safe transactions)
    await safeExec(await safe.getAddress(), safe.interface.encodeFunctionData("enableModule", [await roles.getAddress()]));
    await safeExec(await roles.getAddress(), roles.interface.encodeFunctionData("assignRoles", [sentinel.address, [ROLE], [true]]));
    await safeExec(await roles.getAddress(), roles.interface.encodeFunctionData("scopeTarget", [ROLE, await target.getAddress()])); // clearance = Function (nothing allowed yet)
    await safeExec(await roles.getAddress(), roles.interface.encodeFunctionData("allowFunction", [ROLE, await target.getAddress(), TIGHTEN, ExecOpt.None]));
    assert.ok(await safe.isModuleEnabled(await roles.getAddress()));
  });

  const callTighten = (n) => target.interface.encodeFunctionData("tighten", [n]);

  it("ALLOWED: sentinel calls target.tighten(500) via Roles -> executed by the Safe", async () => {
    const before = await target.cap();
    const tx = await roles.connect(sentinel).execTransactionWithRole(await target.getAddress(), 0, callTighten(500), Op.Call, ROLE, true);
    await tx.wait();
    assert.equal(before, 1000n);
    assert.equal(await target.cap(), 500n);
    assert.equal(await target.tightenCalls(), 1n);
    console.log("      tighten(500) executed, cap 1000 -> 500");
  });

  it("REFUSED: sentinel calls target.relax(10**9) (function not in role)", async () => {
    const data = target.interface.encodeFunctionData("relax", [10n ** 9n]);
    await assert.rejects(
      roles.connect(sentinel).execTransactionWithRole(await target.getAddress(), 0, data, Op.Call, ROLE, true),
      (e) => { console.log("      refused with:", e.message.split("\n")[0].slice(0, 160)); return /FunctionNotAllowed/.test(JSON.stringify(e.data ?? e.message) + e.message) || /reverted/.test(e.message); }
    );
    assert.equal(await target.cap(), 500n);
    assert.equal(await target.relaxCalls(), 0n);
  });

  it("REFUSED: error is a Roles ConditionViolation(FunctionNotAllowed, selector relax), not a Target error", async () => {
    const data = target.interface.encodeFunctionData("relax", [10n ** 9n]);
    try {
      await roles.connect(sentinel).execTransactionWithRole.staticCall(await target.getAddress(), 0, data, Op.Call, ROLE, true);
      assert.fail("should have reverted");
    } catch (e) {
      const parsed = roles.interface.parseError(e.data);
      console.log("      decoded revert:", parsed.name, parsed.args.map(String).join(","));
      assert.equal(parsed.name, "ConditionViolation");
      assert.equal(Number(parsed.args[0]), 3); // Status.FunctionNotAllowed (enum index 3)
      assert.equal(parsed.args[1].slice(0, 10), ethers.id("relax(uint256)").slice(0, 10)); // info = refused selector
    }
  });

  it("REFUSED: tighten() on another address (target not in role)", async () => {
    const other = await (await ethers.getContractFactory("Target")).deploy(await safe.getAddress());
    await assert.rejects(roles.connect(sentinel).execTransactionWithRole(await other.getAddress(), 0, callTighten(1), Op.Call, ROLE, true));
    assert.equal(await other.tightenCalls(), 0n);
  });

  it("REFUSED: tighten() through DelegateCall (options None)", async () => {
    await assert.rejects(roles.connect(sentinel).execTransactionWithRole(await target.getAddress(), 0, callTighten(1), Op.DelegateCall, ROLE, true));
  });

  it("REFUSED: native value transfer from the Safe", async () => {
    await assert.rejects(roles.connect(sentinel).execTransactionWithRole(sentinel.address, 1n, "0x", Op.Call, ROLE, true));
  });

  it("REFUSED: a stranger (not a role member) cannot even call tighten()", async () => {
    await assert.rejects(roles.connect(stranger).execTransactionWithRole(await target.getAddress(), 0, callTighten(1), Op.Call, ROLE, true));
    assert.equal(await target.cap(), 500n);
  });

  it("CONTROL: sentinel calling target.tighten() directly fails (only the Safe may)", async () => {
    await assert.rejects(target.connect(sentinel).tighten(1), /only Safe/);
  });

  it("REVOCABLE: Safe revokes the function; sentinel is then refused on tighten() too", async () => {
    await safeExec(await roles.getAddress(), roles.interface.encodeFunctionData("revokeFunction", [ROLE, await target.getAddress(), TIGHTEN]));
    await assert.rejects(roles.connect(sentinel).execTransactionWithRole(await target.getAddress(), 0, callTighten(100), Op.Call, ROLE, true));
    assert.equal(await target.cap(), 500n);
  });
});
