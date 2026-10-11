/**
 * Deploy / refresh the demo on Avalanche Fuji (testnet AVAX only):
 *
 *   FUJI_PRIVATE_KEY=... DEMO_VICTIM=0x... npm run demo:fuji [-- --fresh | --fresh-drainer]
 *
 * - Idempotent: reuses research/demo_reelle/chain/addresses.fuji.json while the contracts still have code.
 *   --fresh          redeploy everything (new collector address too)
 *   --fresh-drainer  redeploy only FreshDrainer (same collector)
 * - Mints 2 480 DemoUSDC to DEMO_VICTIM (only the missing part) and sends it DEMO_VICTIM_AVAX (default 0.2)
 *   test AVAX for gas (skipped if the victim already holds that much).
 * - The deployer key plays the attacker's relayer; the collector is a separate FRESH address whose key
 *   was never stored anywhere (only the address goes in the addresses file).
 * - Prints the estimated total cost first and aborts clearly if the deployer balance is below it.
 * - Writes addresses.fuji.json and appends the NEW contracts to blockchain/DEPLOYMENTS.md.
 * - Key from FUJI_PRIVATE_KEY (preferred) or PRIVATE_KEY via hardhat.config.js. Never printed.
 *
 * Test equivalent, no AVAX needed: node scripts/demo/deploy-fuji.js --network localhost
 * (needs HOLDUP_CHAIN_OUT_DIR so the real addresses.fuji.json is never touched; skips DEPLOYMENTS.md;
 *  the file is flagged fujiEquivalent so the Fuji code paths of drain/reset/lookalike run against the node).
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const FAUCET_URL = "https://build.avax.network/console/primary-network/faucet";

function parseArgs(argv) {
  const o = { network: "fuji", fresh: false, freshDrainer: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--network") o.network = argv[++i];
    else if (argv[i] === "--fresh") o.fresh = true;
    else if (argv[i] === "--fresh-drainer") o.freshDrainer = true;
    else throw new Error(`Unknown argument ${argv[i]}. Accepted: --network fuji|localhost, --fresh, --fresh-drainer.`);
  }
  if (o.network !== "fuji" && o.network !== "localhost") {
    throw new Error(`--network must be fuji (or localhost for the equivalent test), got "${o.network}".`);
  }
  return o;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const equivalent = args.network === "localhost";
  if (equivalent && !process.env.HOLDUP_CHAIN_OUT_DIR) {
    throw new Error("--network localhost (Fuji-equivalent test) requires HOLDUP_CHAIN_OUT_DIR=<throwaway dir> so the real addresses.fuji.json is never overwritten.");
  }
  process.env.HARDHAT_NETWORK = args.network;
  const hre = require("hardhat");
  const { ethers } = hre;
  const lib = await import(pathToFileURL(path.join(__dirname, "..", "..", "..", "research", "demo_reelle", "chain", "lib.mjs")).href);
  lib.assertSafeRpc(hre.network.config.url);
  await hre.run("compile", { quiet: true });

  if (!equivalent) {
    const accounts = hre.network.config.accounts;
    if (!accounts || accounts.length === 0) {
      console.log("No usable Fuji key found (set FUJI_PRIVATE_KEY in .env). Faucet: " + FAUCET_URL);
      return;
    }
  }
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);
  if (!equivalent && chainId !== lib.FUJI_CHAIN_ID) throw new Error(`Refused: chain id ${chainId} is not Fuji.`);
  const balance = await ethers.provider.getBalance(deployer.address);
  if (!equivalent && balance === 0n) {
    console.log(`Deployer ${deployer.address} has 0 AVAX on Fuji. Faucet: ${FAUCET_URL}`);
    return;
  }
  console.log(`Deployer ${deployer.address}  balance ${ethers.formatEther(balance)} AVAX  chain ${chainId}${equivalent ? "  (Fuji-equivalent TEST on a local node)" : ""}`);

  const victimRaw = process.env.DEMO_VICTIM;
  if (!victimRaw || !ethers.isAddress(victimRaw)) {
    throw new Error("Set DEMO_VICTIM to a valid 0x address (your Fuji wallet) before deploying.");
  }
  const victim = ethers.getAddress(victimRaw);
  const victimAvax = ethers.parseEther(process.env.DEMO_VICTIM_AVAX || "0.2");

  // ---- state of the previous deployment ------------------------------------------------------
  const prev = lib.tryReadAddresses("fuji");
  const hasCode = async (a) => !!a && (await ethers.provider.getCode(a)) !== "0x";
  const reusable = !args.fresh && prev && Number(prev.chainId) === chainId && !!prev.fujiEquivalent === equivalent;
  let baseOk = false;
  let drainerOk = false;
  if (reusable) {
    const checks = await Promise.all(["usdc", "wavax", "nft", "router"].map((k) => hasCode(prev[k])));
    baseOk = checks.every(Boolean);
    drainerOk = baseOk && (await hasCode(prev.drainer)) && !args.freshDrainer;
  }
  const deployBase = !baseOk;
  const deployDrainer = deployBase || !drainerOk;
  console.log(
    deployBase ? "Plan: deploy DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter (+ liquidity) and FreshDrainer" :
    deployDrainer ? "Plan: reuse existing demo contracts, redeploy FreshDrainer only" :
    "Plan: everything already deployed (reusing addresses.fuji.json)"
  );

  // collector: a separate fresh address with NO key (kept when the drainer alone is redeployed)
  let collector = !args.fresh && prev && prev.collector && prev.collector.toLowerCase() !== deployer.address.toLowerCase() ? prev.collector : null;
  if (!collector) collector = ethers.Wallet.createRandom().address; // private key dropped immediately

  // ---- balances of the victim ---------------------------------------------------------------
  const usdcAddr = baseOk ? prev.usdc : null;
  let mintToVictim = lib.VICTIM_AMOUNT;
  if (usdcAddr) {
    const u = new ethers.Contract(usdcAddr, lib.ERC20_ABI, ethers.provider);
    const have = await u.balanceOf(victim);
    mintToVictim = have >= lib.VICTIM_AMOUNT ? 0n : lib.VICTIM_AMOUNT - have;
  }
  const victimBal = await ethers.provider.getBalance(victim);
  const sendAvax = victimBal >= victimAvax ? 0n : victimAvax;

  // ---- cost estimate (printed first, abort if the deployer cannot pay) -------------------------
  const fee = await ethers.provider.getFeeData();
  const price = fee.maxFeePerGas || fee.gasPrice || 50n * 10n ** 9n;
  const items = [];
  const estDeploy = async (name, ...a) => {
    const f = await ethers.getContractFactory(name, deployer);
    const tx = await f.getDeployTransaction(...a);
    items.push([`deploy ${name}`, await ethers.provider.estimateGas({ ...tx, from: deployer.address })]);
  };
  if (deployBase) {
    await estDeploy("DemoUSDC");
    await estDeploy("DemoWAVAX");
    await estDeploy("DemoNFT");
    await estDeploy("DemoRouter", deployer.address, deployer.address);
    items.push(["mint+approve+addLiquidity", 70_000n * 2n + 50_000n * 2n + 250_000n]);
  }
  if (deployDrainer) await estDeploy("FreshDrainer", collector);
  if (mintToVictim > 0n) items.push(["mint DemoUSDC to the victim", 70_000n]);
  if (sendAvax > 0n) items.push(["send AVAX to the victim", 21_000n]);
  const gas = items.reduce((s, [, g]) => s + g, 0n);
  const gasCost = (gas * price * 125n) / 100n; // 25 % margin
  const total = gasCost + sendAvax;
  console.log("Estimated cost:");
  for (const [n, g] of items) console.log(`  ${n.padEnd(30)} ~${g} gas`);
  console.log(`  gas ${ethers.formatEther(gasCost)} AVAX (price ${ethers.formatUnits(price, "gwei")} gwei, +25 %) + victim AVAX ${ethers.formatEther(sendAvax)} = ${ethers.formatEther(total)} AVAX`);
  if (balance < total) {
    throw new Error(`Aborted: deployer balance ${ethers.formatEther(balance)} AVAX is below the estimated cost ${ethers.formatEther(total)} AVAX. Fund ${deployer.address} (faucet: ${FAUCET_URL}) and rerun.`);
  }

  // ---- execution ------------------------------------------------------------------------------
  // Keep everything (contact, lookalike, anchor...) when only the drainer is redeployed; after a full
  // redeploy only the EvidenceAnchor address survives (it does not depend on the demo contracts).
  const sameChain = prev && Number(prev.chainId) === chainId && !!prev.fujiEquivalent === equivalent;
  const out = !prev ? {} : deployBase ? (sameChain && prev.anchor ? { anchor: prev.anchor } : {}) : { ...prev };
  const txLink = (h) => `    ${lib.explorerTx(chainId, h, "fuji")}`;
  const newRows = [];
  const deploy = async (name, ...a) => {
    const f = await ethers.getContractFactory(name, deployer);
    const c = await f.deploy(...a);
    await c.waitForDeployment();
    const addr = await c.getAddress();
    console.log(`  ${name.padEnd(13)} ${addr}\n${txLink(c.deploymentTransaction().hash)}`);
    newRows.push([name, addr]);
    return c;
  };

  let usdc;
  if (deployBase) {
    usdc = await deploy("DemoUSDC");
    const wavax = await deploy("DemoWAVAX");
    const nft = await deploy("DemoNFT");
    const router = await deploy("DemoRouter", await usdc.getAddress(), await wavax.getAddress());
    const U = ethers.parseUnits("100000", 6);
    const W = ethers.parseEther("1000");
    await (await usdc.mint(deployer.address, U)).wait();
    await (await wavax.mint(deployer.address, W)).wait();
    await (await usdc.approve(await router.getAddress(), U)).wait();
    await (await wavax.approve(await router.getAddress(), W)).wait();
    await (await router.addLiquidity(U, W)).wait();
    Object.assign(out, { usdc: await usdc.getAddress(), wavax: await wavax.getAddress(), router: await router.getAddress(), nft: await nft.getAddress() });
  } else {
    usdc = new ethers.Contract(prev.usdc, lib.ERC20_ABI, deployer);
  }
  if (deployDrainer) {
    const drainer = await deploy("FreshDrainer", collector);
    out.drainer = await drainer.getAddress();
  }
  if (mintToVictim > 0n) {
    const tx = await usdc.mint(victim, mintToVictim);
    await tx.wait();
    console.log(`  victim ${victim} minted ${ethers.formatUnits(mintToVictim, 6)} DUSDC\n${txLink(tx.hash)}`);
  } else console.log("  victim already holds >= 2480 DUSDC: no mint");
  if (sendAvax > 0n) {
    const tx = await deployer.sendTransaction({ to: victim, value: sendAvax });
    await tx.wait();
    console.log(`  victim ${victim} received ${ethers.formatEther(sendAvax)} test AVAX\n${txLink(tx.hash)}`);
  } else console.log(`  victim already holds >= ${ethers.formatEther(victimAvax)} AVAX: no transfer`);

  Object.assign(out, {
    chainId,
    rpcUrl: hre.network.config.url,
    mode: equivalent ? "fuji-equivalent" : "fuji",
    collector,
    victim,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  });
  if (equivalent) out.fujiEquivalent = true;
  else delete out.fujiEquivalent;
  lib.writeAddresses("fuji", out);
  console.log(`\nWritten: ${lib.addressesPath("fuji")}  (collector ${collector}: address only, no key exists)`);

  if (!equivalent && newRows.length) {
    const mdPath = path.join(__dirname, "..", "..", "DEPLOYMENTS.md");
    const rows = newRows.map(([n, a]) => `| ${n} | ${a} | https://testnet.snowtrace.io/address/${a} |`).join("\n");
    let md = fs.readFileSync(mdPath, "utf8");
    if (!md.endsWith("\n")) md += "\n";
    fs.writeFileSync(mdPath, md + rows + "\n");
    console.log("Appended rows to blockchain/DEPLOYMENTS.md");
  }
}

main()
  .then(() => setImmediate(() => process.exit(process.exitCode ?? 0)))
  .catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
