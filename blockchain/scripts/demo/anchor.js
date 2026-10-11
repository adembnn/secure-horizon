/**
 * Deploy EvidenceAnchor (Merkle-root anchoring of the verdict journal): npm run anchor:local | anchor:fuji
 * Compiled from research/titouan/T_banc_e2e/anchor/contracts via hardhat.anchor.config.js (folder untouched).
 * Records the address under `anchor` in addresses.<local|fuji>.json (creates a minimal file if absent,
 * which demo:fuji / demo:deploy then keep or overwrite) and, on Fuji, appends a row to DEPLOYMENTS.md.
 * Redirect the output with HOLDUP_CHAIN_OUT_DIR for tests.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

async function main() {
  const name = hre.network.name;
  if (name !== "fuji" && name !== "localhost") throw new Error(`Run with --network fuji or localhost (got "${name}").`);
  const kind = name === "fuji" ? "fuji" : "local";
  const lib = await import(pathToFileURL(path.join(__dirname, "..", "..", "..", "research", "demo_reelle", "chain", "lib.mjs")).href);
  lib.assertSafeRpc(hre.network.config.url);
  if (kind === "fuji" && (!hre.network.config.accounts || hre.network.config.accounts.length === 0)) {
    console.log("No usable Fuji key found (set FUJI_PRIVATE_KEY in .env). Faucet: " + lib.FUJI_FAUCET);
    return;
  }
  await hre.run("compile", { quiet: true });
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  if (kind === "fuji" && bal === 0n) {
    console.log(`Deployer ${deployer.address} has 0 AVAX on Fuji. Faucet: ${lib.FUJI_FAUCET}`);
    return;
  }
  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);
  const f = await hre.ethers.getContractFactory("EvidenceAnchor", deployer);
  const c = await f.deploy();
  await c.waitForDeployment();
  const addr = await c.getAddress();
  const tx = c.deploymentTransaction().hash;
  console.log(`EvidenceAnchor ${addr}  (chain ${chainId})`);
  if (kind === "fuji") console.log(`  ${lib.explorerAddress(chainId, addr, "fuji")}\n  ${lib.explorerTx(chainId, tx, "fuji")}`);

  const prev = lib.tryReadAddresses(kind) || { chainId, rpcUrl: hre.network.config.url };
  prev.anchor = addr;
  lib.writeAddresses(kind, prev);
  console.log(`Recorded as "anchor" in ${lib.addressesPath(kind)}`);

  if (kind === "fuji") {
    const mdPath = path.join(__dirname, "..", "..", "DEPLOYMENTS.md");
    let md = fs.readFileSync(mdPath, "utf8");
    if (!md.endsWith("\n")) md += "\n";
    fs.writeFileSync(mdPath, md + `| EvidenceAnchor | ${addr} | https://testnet.snowtrace.io/address/${addr} |\n`);
    console.log("Appended a row to blockchain/DEPLOYMENTS.md");
  }
}

main()
  .then(() => setImmediate(() => process.exit(process.exitCode ?? 0)))
  .catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
