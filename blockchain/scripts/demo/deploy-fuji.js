/**
 * Deploy the demo contracts on Avalanche Fuji (testnet AVAX only): npm run demo:fuji
 * Reads the key from FUJI_PRIVATE_KEY (preferred) or PRIVATE_KEY, loaded by hardhat.config.js.
 * Writes addresses.fuji.json and appends a row to blockchain/DEPLOYMENTS.md with Snowtrace links.
 * If there is no usable key, or the deployer balance is 0, prints one clear line (deployer
 * address if known, and the faucet URL) and exits without a stack trace.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const FAUCET_URL = "https://build.avax.network/console/primary-network/faucet";

async function main() {
  if (hre.network.name !== "fuji") {
    throw new Error(`Run with --network fuji (got "${hre.network.name}").`);
  }
  const lib = await import(
    pathToFileURL(path.join(__dirname, "..", "..", "..", "research", "demo_reelle", "chain", "lib.mjs")).href
  );

  const accounts = hre.network.config.accounts;
  if (!accounts || accounts.length === 0) {
    console.log(
      "No usable Fuji key found (set FUJI_PRIVATE_KEY in .env). Faucet: " + FAUCET_URL
    );
    process.exitCode = 0;
    return;
  }

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  if (balance === 0n) {
    console.log(
      `Deployer ${deployer.address} has 0 AVAX on Fuji. Faucet: ${FAUCET_URL}`
    );
    process.exitCode = 0;
    return;
  }

  console.log(`Deployer ${deployer.address}  balance ${hre.ethers.formatEther(balance)} AVAX`);

  const victim = process.env.DEMO_VICTIM;
  if (!victim || !hre.ethers.isAddress(victim)) {
    throw new Error("Set DEMO_VICTIM to a valid 0x address (your Fuji wallet) before deploying.");
  }

  const deploy = async (name, ...args) => {
    const f = await hre.ethers.getContractFactory(name, deployer);
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
  const drainer = await deploy("FreshDrainer", deployer.address);

  await (await usdc.mint(hre.ethers.getAddress(victim), lib.VICTIM_AMOUNT)).wait();
  console.log(`  victim ${victim} minted 2480 DUSDC`);

  const out = {
    chainId: 43113,
    rpcUrl: hre.network.config.url,
    mode: "fuji",
    usdc: await usdc.getAddress(),
    wavax: await wavax.getAddress(),
    router: await router.getAddress(),
    nft: await nft.getAddress(),
    drainer: await drainer.getAddress(),
    collector: deployer.address,
    victim: hre.ethers.getAddress(victim),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };
  lib.writeAddresses("fuji", out);

  const mdPath = path.join(__dirname, "..", "..", "DEPLOYMENTS.md");
  const rows = [
    ["DemoUSDC", out.usdc],
    ["DemoWAVAX", out.wavax],
    ["DemoNFT", out.nft],
    ["DemoRouter", out.router],
    ["FreshDrainer", out.drainer],
  ]
    .map(([n, a]) => `| ${n} | ${a} | https://testnet.snowtrace.io/address/${a} |`)
    .join("\n");
  let md = fs.readFileSync(mdPath, "utf8");
  if (!md.endsWith("\n")) md += "\n";
  fs.writeFileSync(mdPath, md + rows + "\n");

  console.log("\nWritten: research/demo_reelle/chain/addresses.fuji.json");
  console.log("Appended rows to blockchain/DEPLOYMENTS.md\n");
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
