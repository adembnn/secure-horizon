/**
 * Deploy the whole demo on the LOCAL node (plain or Avalanche fork) for a rehearsal.
 *
 *   DEMO_VICTIM=0xYourWalletAddress npm run demo:deploy -- --network localhost
 *
 * - DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter (seeded), then FreshDrainer LAST (brand-new contract)
 *   whose collector is a dedicated "attacker" account (Hardhat account #1).
 * - Mints 2 480 DemoUSDC to DEMO_VICTIM and gives it 100 local test AVAX (hardhat_setBalance).
 * - Fork mode: also gives the victim 2 480 REAL-code USDC (storage write, local only) -> realUsdc.
 * - Writes research/demo_reelle/chain/addresses.local.json.
 * Never talks to anything but the local node.
 */
const hre = require("hardhat");
const path = require("path");
const { pathToFileURL } = require("url");

async function main() {
  if (hre.network.name !== "localhost") {
    throw new Error(`Run with --network localhost (got "${hre.network.name}"). For Fuji use: npm run demo:fuji`);
  }
  const lib = await import(pathToFileURL(path.join(__dirname, "..", "..", "..", "research", "demo_reelle", "chain", "lib.mjs")).href);
  const { ethers } = hre;
  const rpcUrl = hre.network.config.url;
  lib.assertSafeRpc(rpcUrl);

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const attacker = signers[1];

  let victim = process.env.DEMO_VICTIM;
  if (!victim) {
    victim = signers[5].address;
    console.log(`[warn] DEMO_VICTIM not set -> using Hardhat account #5 (${victim}). Set DEMO_VICTIM to your wallet address.`);
  }
  if (!ethers.isAddress(victim)) throw new Error("DEMO_VICTIM is not a valid 0x address.");
  victim = ethers.getAddress(victim);

  const meta = await ethers.provider.send("hardhat_metadata", []).catch(() => ({}));
  const mode = meta.forkedNetwork ? "fork" : "plain";
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  console.log(`\nLocal node ${rpcUrl}  mode=${mode}  chainId=${chainId}`);

  const deploy = async (name, ...args) => {
    const f = await ethers.getContractFactory(name, deployer);
    const c = await f.deploy(...args);
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log(`  ${name.padEnd(13)} ${a}`);
    return c;
  };

  const usdc = await deploy("DemoUSDC");
  const wavax = await deploy("DemoWAVAX");
  const nft = await deploy("DemoNFT");
  const router = await deploy("DemoRouter", await usdc.getAddress(), await wavax.getAddress());

  // Router liquidity (so the legitimate swap works in the demo).
  const U = ethers.parseUnits("100000", 6);
  const W = ethers.parseEther("1000");
  await (await usdc.mint(deployer.address, U)).wait();
  await (await wavax.mint(deployer.address, W)).wait();
  await (await usdc.approve(await router.getAddress(), U)).wait();
  await (await wavax.approve(await router.getAddress(), W)).wait();
  await (await router.addLiquidity(U, W)).wait();

  // Brand-new drainer, deployed last, collector = dedicated attacker account.
  const drainer = await deploy("FreshDrainer", attacker.address);

  // Victim: gas + 2 480 DemoUSDC (+ real-code USDC on a fork).
  await lib.setLocalBalance(ethers.provider, victim, 100n);
  await (await usdc.mint(victim, lib.VICTIM_AMOUNT)).wait();
  const out = {
    chainId,
    rpcUrl,
    mode,
    usdc: await usdc.getAddress(),
    wavax: await wavax.getAddress(),
    router: await router.getAddress(),
    nft: await nft.getAddress(),
    drainer: await drainer.getAddress(),
    collector: attacker.address,
    victim,
    deployer: deployer.address,
  };
  if (mode === "fork") {
    const raw = new lib.ethers.JsonRpcProvider(rpcUrl);
    const slot = await lib.setRealUsdcBalance(raw, victim, lib.VICTIM_AMOUNT);
    out.realUsdc = lib.REAL_USDC;
    console.log(`  Real USDC (fork) ${lib.REAL_USDC}: victim funded 2480 (balance slot ${slot})`);
  }
  out.deployedAt = new Date().toISOString();
  out.blockNumber = await ethers.provider.getBlockNumber();

  lib.writeAddresses("local", out);
  console.log(`\nVictim ${victim}: 2480 DUSDC, 100 test AVAX. Collector (attacker) ${attacker.address}`);
  console.log("Written: research/demo_reelle/chain/addresses.local.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
